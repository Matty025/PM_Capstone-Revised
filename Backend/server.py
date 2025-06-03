from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt
import json
import subprocess
import os
import threading
import sys
import psutil

app = Flask(__name__)
CORS(app)  # Allow CORS for frontend access

# MQTT broker settings
MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
MQTT_TOPIC = "obd/data"

# Store the latest OBD data
latest_obd_data = {}
obd_process = None  # Single instance tracking

# Kill any running obddata.py process when the server starts
def kill_existing_obd_process():
    for proc in psutil.process_iter(attrs=['pid', 'name', 'cmdline']):
        try:
            if proc.info['name'] == "python.exe" and proc.info['cmdline'] and any("obddata.py" in arg for arg in proc.info['cmdline']):
                print(f"🔴 Killing existing `obddata.py` process (PID: {proc.pid})...")
                proc.terminate()
                proc.wait(timeout=5)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

kill_existing_obd_process()

# MQTT callback when a message is received
def on_message(client, userdata, msg):
    global latest_obd_data
    try:
        latest_obd_data = json.loads(msg.payload.decode("utf-8"))
        # Uncomment to debug:
        # print(f"📡 MQTT Received: {latest_obd_data}")
    except Exception as e:
        print(f"❌ MQTT message decode error: {e}")

# MQTT logging
def on_log(client, userdata, level, buf):
    print(f"[MQTT LOG] {buf}")

# Start MQTT client in a background thread
def start_mqtt():
    client = mqtt.Client()
    client.on_message = on_message
    client.on_log = on_log
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    client.subscribe(MQTT_TOPIC)
    client.loop_forever()

mqtt_thread = threading.Thread(target=start_mqtt, daemon=True)
mqtt_thread.start()

# Function to stream subprocess output
def stream_output(pipe, name):
    for line in iter(pipe.readline, ''):  # '' is the sentinel for end of stream
        print(f"[{name}] {line.rstrip()}")

@app.route("/start-obd", methods=["POST"])
def start_obd():
    global obd_process

    if obd_process and obd_process.poll() is None:
        return jsonify({"message": "OBD data collection already running", "pid": obd_process.pid}), 200

    # Read motorcycle_id from JSON
    data = request.get_json() or {}
    motorcycle_id = data.get("motorcycle_id")

    print(f"🟢 Starting OBD data collection for motorcycle_id={motorcycle_id}")

    try:
        # Start subprocess
        args = [sys.executable, "obddata.py"]
        if motorcycle_id:
            args.append(str(motorcycle_id))

        obd_process = subprocess.Popen(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True  # Ensures stdout/stderr are text, not bytes
        )

        # Stream output asynchronously
        threading.Thread(target=stream_output, args=(obd_process.stdout, "STDOUT"), daemon=True).start()
        threading.Thread(target=stream_output, args=(obd_process.stderr, "STDERR"), daemon=True).start()

        return jsonify({"message": "OBD data collection started", "pid": obd_process.pid}), 200

    except Exception as e:
        return jsonify({"error": f"Failed to start obddata.py: {e}"}), 500

@app.route("/stop-obd", methods=["GET"])
def stop_obd():
    global obd_process

    if obd_process and obd_process.poll() is None:
        print(f"🛑 Stopping OBD process (PID: {obd_process.pid})...")
        obd_process.terminate()
        try:
            obd_process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            obd_process.kill()
        obd_process = None
        return jsonify({"message": "OBD data collection stopped"}), 200

    return jsonify({"message": "No running OBD data collection process"}), 200

@app.route("/obd-data", methods=["GET"])
def get_obd_data():
    return jsonify(latest_obd_data)

if __name__ == "__main__":
    app.run(debug=True, port=5000)

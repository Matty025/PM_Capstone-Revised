from flask import Flask, jsonify, request
from influxdb_client import InfluxDBClient

# Flask app
app = Flask(__name__)

# InfluxDB configuration
INFLUXDB_URL = "http://localhost:8086"
INFLUXDB_TOKEN = "J1-CbguXYPEgwc8tVJ4EL2AfY59dti59pdlBqHkmMuJth_jJ4mdPu46hF929D-ZVuNnbGiCS9QC7qBASETFmZw=="
INFLUXDB_ORG = "MotorcycleMaintenance"
INFLUXDB_BUCKET = "MotorcycleOBDData"

# Connect to InfluxDB
client = InfluxDBClient(
    url=INFLUXDB_URL,
    token=INFLUXDB_TOKEN,
    org=INFLUXDB_ORG
)
query_api = client.query_api()

def query_mean(command, time_range, motorcycle_id):
    query = f'''
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: {time_range})
      |> filter(fn: (r) => r["_measurement"] == "obd_data")
      |> filter(fn: (r) => r["motorcycle_id"] == "{motorcycle_id}")
      |> filter(fn: (r) => r["_field"] == "value")
      |> filter(fn: (r) => r["command"] == "{command}")
      |> mean()
    '''
    result = query_api.query(query)
    for table in result:
        for record in table.records:
            return round(record.get_value(), 2)
    return None

@app.route("/reports/daily", methods=["GET"])
def daily_report():
    motorcycle_id = request.args.get("motorcycle_id", "unknown")
    report = {
        "avg_rpm": query_mean("RPM", "-24h", motorcycle_id),
        "avg_speed": query_mean("SPEED", "-24h", motorcycle_id),
        "avg_temp": query_mean("COOLANT_TEMP", "-24h", motorcycle_id),
        "avg_voltage": query_mean("ELM_VOLTAGE", "-24h", motorcycle_id)
    }
    return jsonify(report)

@app.route("/reports/weekly", methods=["GET"])
def weekly_report():
    motorcycle_id = request.args.get("motorcycle_id", "unknown")
    report = {
        "avg_rpm": query_mean("RPM", "-7d", motorcycle_id),
        "avg_speed": query_mean("SPEED", "-7d", motorcycle_id),
        "avg_temp": query_mean("COOLANT_TEMP", "-7d", motorcycle_id),
        "avg_voltage": query_mean("ELM_VOLTAGE", "-7d", motorcycle_id)
    }
    return jsonify(report)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

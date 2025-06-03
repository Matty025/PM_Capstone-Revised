import React, { useEffect, useState, useCallback } from "react";
import mqtt from "mqtt";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./Dashboard.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [motorcycle, setMotorcycle] = useState(null);
  const [obdData, setObdData] = useState({
    RPM: 0,
    COOLANT_TEMP: 0,
    SPEED: 0,
    ELM_VOLTAGE: 0,
  });

  const [chartData, setChartData] = useState({
    RPM: { labels: [], data: [] },
    COOLANT_TEMP: { labels: [], data: [] },
    SPEED: { labels: [], data: [] },
    ELM_VOLTAGE: { labels: [], data: [] },
  });

  useEffect(() => {
    const storedMotorcycle = localStorage.getItem("selectedMotorcycle");
    if (!storedMotorcycle) {
      alert("No motorcycle selected. Redirecting...");
      navigate("/signup-motorcycle");
    } else {
      setMotorcycle(JSON.parse(storedMotorcycle));
    }
  }, [navigate]);

  const updateChartData = useCallback((data) => {
    const newTime = new Date().toLocaleTimeString();

    setChartData((prevData) => ({
      RPM: {
        labels: [...prevData.RPM.labels, newTime].slice(-20),
        data: [...prevData.RPM.data, data.RPM || 0].slice(-20),
      },
      COOLANT_TEMP: {
        labels: [...prevData.COOLANT_TEMP.labels, newTime].slice(-20),
        data: [...prevData.COOLANT_TEMP.data, data.COOLANT_TEMP || 0].slice(-20),
      },
      SPEED: {
        labels: [...prevData.SPEED.labels, newTime].slice(-20),
        data: [...prevData.SPEED.data, data.SPEED || 0].slice(-20),
      },
      ELM_VOLTAGE: {
        labels: [...prevData.ELM_VOLTAGE.labels, newTime].slice(-20),
        data: [...prevData.ELM_VOLTAGE.data, data.ELM_VOLTAGE || 0].slice(-20),
      },
    }));
  }, []);

  useEffect(() => {
    const client = mqtt.connect("wss://test.mosquitto.org:8081/mqtt", {
      reconnectPeriod: 5000,
      keepalive: 60,
    });

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      client.subscribe("obd/data");
    });

    client.on("message", (topic, message) => {
      if (topic === "obd/data") {
        const rawMessage = message.toString();
        console.log("Raw MQTT message:", rawMessage);

        try {
          const payload = JSON.parse(rawMessage);
          console.log("Parsed payload:", payload);

          // Ensure motorcycle_id matches your selected motorcycle (string comparison)
          if (payload.motorcycle_id === String(motorcycle?.id)) {
            const data = payload.data || {};

            const normalizedData = {
              RPM: data.RPM || 0,
              COOLANT_TEMP: data.COOLANT_TEMP || 0,
              SPEED: data.SPEED || 0,
              ELM_VOLTAGE: data.ELM_VOLTAGE || 0,
            };

            setObdData(normalizedData);
            updateChartData(normalizedData);
          } else {
            console.log("Received data for another motorcycle:", payload.motorcycle_id);
          }
        } catch (error) {
          console.error("MQTT parse error:", error);
        }
      }
    });

    return () => {
      client.end();
    };
  }, [motorcycle, updateChartData]);

  const handleStartOBD = async () => {
    try {
      await axios.post("http://localhost:5000/start-obd", {
        motorcycle_id: motorcycle?.id,
      });
    } catch (error) {
      console.error("Start OBD error:", error);
    }
  };

  const handleStopOBD = async () => {
    try {
      await axios.get("http://localhost:5000/stop-obd");
    } catch (error) {
      console.error("Stop OBD error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const renderChart = (label, key) => (
    <div className="chartBox">
      <h3>{label}</h3>
      <Line
        data={{
          labels: chartData[key].labels,
          datasets: [
            {
              label: label,
              data: chartData[key].data,
              borderColor: "#007bff",
              backgroundColor: "rgba(0, 123, 255, 0.1)",
              tension: 0.4,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: { legend: { display: true }, title: { display: false } },
          scales: { y: { beginAtZero: true } },
        }}
      />
    </div>
  );

  return (
    <div className="dashboardContainer">
      <button
  className={`hamburger ${sidebarOpen ? "hide" : ""}`}
  onClick={() => setSidebarOpen(true)}
>
  ☰
</button>

      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
  <button className="closeBtn" onClick={() => setSidebarOpen(false)}>
    ✖
  </button>

  <button className="profileBtn" onClick={() => navigate("/profile")}>
  <img 
    src="https://static.vecteezy.com/system/resources/previews/025/267/725/non_2x/portrait-of-a-man-wearing-a-motocross-rider-helmet-and-wearing-a-sweater-side-view-suitable-for-avatar-social-media-profile-print-etc-flat-graphic-vector.jpg   " 
    alt="Profile" 
    className="profileImage" 
  />
  <h3 className="profileLabel">Profile</h3>
</button>

  <button onClick={() => navigate("/dashboard")}>Dashboard</button>
  <button onClick={() => navigate("/Reports")}>Reports</button>
  <button onClick={() => navigate("/predictivemaintenance")}>Preventive Maintenance</button>
  <button onClick={() => navigate("/alerts")}>Alerts</button>
  <button onClick={() => navigate("/Settings")}>Settings</button>
  <button onClick={handleLogout}>Logout</button>
</div>


      <div className="dashboardContent">
        <h1>OBD Real-Time Dashboard</h1>

        <div className="buttonGroup">
          <button onClick={handleStartOBD}>Start OBD</button>
          <button onClick={handleStopOBD}>Stop OBD</button>
        </div>

        <div className="currentValues">
          <div className="valueCard">RPM: {obdData.RPM}</div>
          <div className="valueCard">Speed: {obdData.SPEED} km/h</div>
          <div className="valueCard">Coolant: {obdData.COOLANT_TEMP} °C</div>
          <div className="valueCard">Voltage: {obdData.ELM_VOLTAGE} V</div>
        </div>

        <div className="chartGrid">
          {renderChart("RPM", "RPM")}
          {renderChart("Speed", "SPEED")}
          {renderChart("Coolant Temp", "COOLANT_TEMP")}
          {renderChart("Voltage", "ELM_VOLTAGE")}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

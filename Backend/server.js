require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");
const mqtt = require("mqtt");
const { InfluxDB, Point } = require("@influxdata/influxdb-client");

const app = express();
const port = 3001;

// InfluxDB config
const influxUrl = "http://localhost:8086";
const influxToken = process.env.INFLUX_TOKEN || "y2gPcpacMB5yTLjeEuYVe7lR2AWjN_3p9R29XsHWYkuozvV-TzzJVi5u8Z1G3YwtXXPQBXOXaYc8fM1-wWOfzw==";
const influxOrg = "MotorcycleMaintenance";
const influxBucket = "MotorcycleOBDData";

const influxDB = new InfluxDB({ url: influxUrl, token: influxToken });
const writeApi = influxDB.getWriteApi(influxOrg, influxBucket, "ms");

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test DB Connection (simple query)
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log("✅ Connected to PostgreSQL database");
  }
});

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Access denied, no token provided" });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// --- Routes ---

// Signup (no bcrypt yet)
app.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const result = await pool.query(
      "INSERT INTO users (first_name, last_name, email, phone, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, email",
      [firstName, lastName, email, phone, password]
    );

    res.status(201).json({
      message: "✅ User registered successfully!",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("🔥 Signup error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login (plaintext password check)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const result = await pool.query("SELECT id, email, password FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    if (password.trim() !== user.password.trim()) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token, userId: user.id, email: user.email });
  } catch (error) {
    console.error("🔥 Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// Get User Profile
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    const result = await pool.query(
      "SELECT first_name, last_name, email, phone FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: "User not found" });

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Signup Motorcycle
app.post("/signup-motorcycle", async (req, res) => {
  try {
    const { user_id, brand, model, year, plateNumber, odometer_km, last_oil_change } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    if (!brand || !model || !year || !plateNumber) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    const odometer = odometer_km || 0;
    const lastOilChange = last_oil_change || null;

    const result = await pool.query(
      `INSERT INTO motorcycles 
        (user_id, brand, model, year, plate_number, odometer_km, last_oil_change) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [user_id, brand, model, year, plateNumber, odometer, lastOilChange]
    );

    res.status(201).json({
      message: "✅ Motorcycle registered successfully!",
      motorcycle: result.rows[0],
    });
  } catch (error) {
    console.error("🔥 Motorcycle Signup Error:", error);
    if (error.code === "23505") {
      return res.status(400).json({ error: "Plate number already exists!" });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get User Motorcycles
app.get("/get-motorcycles", authenticateToken, async (req, res) => {
  const { userId } = req.user;
  if (!userId) return res.status(400).json({ error: "User ID required" });

  try {
    const result = await pool.query("SELECT * FROM motorcycles WHERE user_id = $1", [userId]);
    res.json({ motorcycles: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// MQTT Setup
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://test.mosquitto.org";
const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on("connect", () => {
  console.log("🔌 Connected to MQTT broker:", MQTT_BROKER_URL);
  mqttClient.subscribe("obd/data", (err) => {
    if (err) {
      console.error("❌ MQTT subscription error:", err);
    } else {
      console.log("✅ Subscribed to topic: obd/data");
    }
  });
});

mqttClient.on("error", (error) => {
  console.error("❌ MQTT Client Error:", error);
});

mqttClient.on("message", (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    console.log(`📩 MQTT message received on topic "${topic}":`, payload);

    const motorcycleId = payload.motorcycle_id || "unknown";
    const data = payload.data || {};

    const point = new Point("obd_data").tag("motorcycle_id", motorcycleId);

    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "number") {
        point.floatField(key.toLowerCase(), value);
      }
    }

    writeApi.writePoint(point);
    writeApi.flush()
      .then(() => console.log("[InfluxDB] Data written successfully"))
      .catch((err) => console.error("[InfluxDB] Write error:", err));

  } catch (e) {
    console.error("Error parsing or processing MQTT message:", e);
  }
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

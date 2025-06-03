require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test Database Connection
pool.connect((err) => {
  if (err) {
    console.error("❌ Database connection error:", err.stack);
  } else {
    console.log("✅ Connected to PostgreSQL database");
  }
});

// Middleware to Protect Routes
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access denied, no token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// User Signup Route (No bcrypt)
app.post("/signup", async (req, res) => {
  try {
    console.log("📥 Incoming Request Body:", req.body);

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

// User Login Route (Fixed Password Comparison)
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔹 Login attempt:", email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const result = await pool.query("SELECT id, email, password FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Check password (no hashing in this version)
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

// Get User Profile Route (Fetch User Data)
app.get("/get-user", authenticateToken, async (req, res) => {
  const { userId } = req.user;

  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  try {
    const result = await pool.query(
      "SELECT first_name, last_name, email, phone FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
});
// signup motorcycles
app.post("/signup-motorcycle", async (req, res) => {
  try {
    const { user_id, brand, model, year, plateNumber, odometer_km, last_oil_change } = req.body;

    if (!user_id) {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }

    if (!brand || !model || !year || !plateNumber) {
      return res.status(400).json({ error: "All fields are required!" });
    }

    // Use provided odometer_km and last_oil_change, or default values if missing
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


// Get User Motorcycles (Protected Route)
app.get("/get-motorcycles", authenticateToken, async (req, res) => {
  const { userId } = req.user; // Get userId from authenticated token

  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM motorcycles WHERE user_id = $1",
      [userId]
    );

    // If no motorcycles found, return empty array with 200 status
    if (result.rows.length === 0) {
      return res.status(200).json({ motorcycles: [] });
    }

    // Return the motorcycles array
    res.json({ motorcycles: result.rows });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server error" });
  }
}); 
//linnnnnneeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

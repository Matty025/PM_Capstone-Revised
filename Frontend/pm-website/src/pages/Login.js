import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css"; 

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter your credentials");
      return;
    }

    console.log("Attempting to log in with:", { email, password });

    try {
      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log("Server response:", data);

      if (response.ok) {
        if (data.userId) { 
          console.log("Login successful. User ID:", data.userId);

          // Store userId and token in localStorage
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("token", data.token);  

          // Log stored userId to verify it's saved correctly
          console.log("Stored userId:", localStorage.getItem("userId"));

          navigate("/signup-motorcycle");
        } else {
          console.error("Invalid response format:", data);
          setError("Unexpected server response. Please try again.");
        }
      } else {
        console.error("Server error:", data.error);
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err.message);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="left-section">
        <h1>Welcome to Motorcycle Preventive Maintenance</h1>
        <h3>Ensure the longevity and performance of your motorcycle with our predictive maintenance system.</h3>
      </div>

      <div className="right-section">
        <div className="login-form">
          <h2>Login</h2>

          {error && <p className="error-message">{error}</p>}

          <input 
            type="text" 
            placeholder="Email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />

          <input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />

          <button onClick={handleLogin}>Login</button>

          <p>
            Don't have an account? <Link to="/signup-personal">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    // Basic email pattern
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.warn("Please enter both email and password.");
      return;
    }

    if (!validateEmail(email)) {
      toast.warn("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.userId) {
        localStorage.setItem("userId", data.userId);
        localStorage.setItem("token", data.token);

        toast.success("Login successful!", { autoClose: 2000 });

        setTimeout(() => {
          navigate("/signup-motorcycle");
        }, 2000);
      } else {
        toast.error(data.error || "Login failed. Please check your credentials.");
      }
    } catch (err) {
      toast.error("🚫 Error connecting to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <ToastContainer position="top-center" />
      <div className="left-section">
        <h1>Welcome to Motorcycle Preventive Maintenance</h1>
        <h3>
          Ensure the longevity and performance of your motorcycle with our
          predictive maintenance system.
        </h3>
      </div>

      <div className="right-section">
        <div className="login-form">
          <h2>Login</h2>

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

          <button onClick={handleLogin} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <p>
            Don't have an account? <Link to="/signup-personal">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

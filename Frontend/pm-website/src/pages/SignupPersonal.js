import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Signup.module.css";

function SignupPersonal() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    firstName: "",  // ✅ Updated variable names
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    if (userData.password !== userData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const { confirmPassword, ...userPayload } = userData; // Remove confirmPassword

      console.log("📩 Sending Data:", userPayload); // Debugging

      const response = await fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      });

      const data = await response.json();
      console.log("📩 Signup Response:", data);

      if (response.ok) {
        alert(data.message);
        navigate("/login");
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("❌ Signup Error:", error);
      alert("Server error. Please try again.");
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
        <h2>Sign Up</h2>
        <form>
          <input
            className={styles.input}
            type="text"
            name="firstName" // ✅ Updated name
            placeholder="First Name"
            required
            onChange={handleChange}
          />
          <input
            className={styles.input}
            type="text"
            name="lastName" // ✅ Updated name
            placeholder="Last Name"
            required
            onChange={handleChange}
          />
          <input
            className={styles.input}
            type="email"
            name="email"
            placeholder="Email"
            required
            onChange={handleChange}
          />
          <input
            className={styles.input}
            type="tel"
            name="phone"
            placeholder="Phone Number"
            required
            onChange={handleChange}
          />
          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            required
            onChange={handleChange}
          />
          <input
            className={styles.input}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            required
            onChange={handleChange}
          />
          <button
            className={styles.button}
            type="button"
            onClick={handleSignup}
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupPersonal;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Signup.module.css";

function SignupPersonal() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  };

  const handleSignup = async () => {
    // 1. Check for empty fields
    for (const [key, value] of Object.entries(userData)) {
      if (!value.trim()) {
        toast.error("All fields are required.");
        return;
      }
    }

    // 2. Validate email format
    if (!isValidEmail(userData.email)) {
      toast.error("Email must be a valid email address.");
      return;
    }

    // 3. Password length check
    if (userData.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    // 4. Password match check
    if (userData.password !== userData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    // 5. Validate phone number format (Philippines)
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(userData.phone)) {
      toast.error("Phone must start with 09 and be 11 digits.");
      return;
    }

    try {
      const { confirmPassword, ...userPayload } = userData;

      const response = await fetch("http://localhost:3001/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userPayload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Signup successful!", {
          onClose: () => navigate("/login"),
          autoClose: 2000,
        });
      } else {
        toast.error(data.error || "Signup failed.");
      }
    } catch (error) {
      console.error("Signup Error:", error);
      toast.error("Server error. Please try again.");
    }
  };

  return (
    <div className={styles.signupContainer}>
      <ToastContainer position="top-center" />
      <div className={styles.signupBox}>
        <h2>Sign Up</h2>
        <form>
          <input
            className={styles.input}
            type="text"
            name="firstName"
            placeholder="First Name"
            required
            onChange={handleChange}
          />
          <input
            className={styles.input}
            type="text"
            name="lastName"
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
            placeholder="Phone Number (e.g., 09XXXXXXXXX)"
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
          <button
            className={styles.cancelButton}
            type="button"
            onClick={() => navigate("/login")}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupPersonal;

import React from "react";
import { Link } from "react-router-dom";
import styles from "./Signup.module.css";

function Signup() {
  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
        <h2>Sign up for Motorcycle FI Maintenance</h2>
        <form>
          <label>First Name</label>
          <input className={styles.input} type="text" placeholder="First Name" required />

          <label>Last Name</label>
          <input className={styles.input} type="text" placeholder="Last Name" required />

          <label>Email Address</label>
          <input className={styles.input} type="email" placeholder="Email" required />

          <label>Phone Number</label>
          <input className={styles.input} type="tel" placeholder="Phone Number" required />

          <label>Address</label>
          <input className={styles.input} type="text" placeholder="Address" required />

          <h3>Motorcycle Details</h3>

          <label>Motorcycle Brand</label>
          <input className={styles.input} type="text" placeholder="e.g., Yamaha, Honda" required />

          <label>Model</label>
          <input className={styles.input} type="text" placeholder="e.g., Sniper 155 FI" required />

          <label>Year</label>
          <input className={styles.input} type="number" placeholder="Year" required />

          <label>Engine Displacement (CC)</label>
          <input className={styles.input} type="number" placeholder="e.g., 155" required />

          <label>License Plate Number</label>
          <input className={styles.input} type="text" placeholder="Plate Number" required />

          <label>VIN (Vehicle Identification Number)</label>
          <input className={styles.input} type="text" placeholder="VIN" required />

          <h3>Maintenance Preferences</h3>

          <label>Preferred Maintenance Schedule</label>
          <select className={styles.input} required>
            <option value="">Select Schedule</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>

          <label>Notification Method</label>
          <select className={styles.input} required>
            <option value="">Select Notification</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="both">Both</option>
          </select>

          <label>Maintenance Type</label>
          <select className={styles.input} required>
            <option value="">Select Type</option>
            <option value="oil_change">Oil Change</option>
            <option value="tire_check">Tire Check</option>
            <option value="engine_inspection">Engine Inspection</option>
            <option value="full_service">Full Service</option>
          </select>

          <div className={styles.checkboxContainer}>
            <input type="checkbox" id="agreeTerms" required />
            <label htmlFor="agreeTerms">
              I agree to the <Link to="/terms">Terms and Conditions</Link> of this maintenance service.
            </label>
          </div>

          <button className={styles.button} type="submit">Register →</button>
        </form>

        <p className={styles.footerLinks}>
          <Link to="/">Home</Link> | <Link to="/privacy">Privacy Policy</Link> | 
          <Link to="/terms">Terms of Service</Link> | <Link to="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Signupmotorcycle.module.css";

function SignupMotorcycle() {
  const navigate = useNavigate();
  const [motorcycles, setMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registerNew, setRegisterNew] = useState(false);
  const [motorcycleData, setMotorcycleData] = useState({
    brand: "",
    model: "",
    year: "",
    plateNumber: "",
    odometer: "",             // user input, but backend expects odometer_km
    lastOilChangeDate: "",    // user input, backend expects last_oil_change
  });

  const brandModels = {
    Yamaha: ["Sniper 155", "Sniper 150", "Aerox 155", "Nmax 155", "Mio i125", "Mio Soul i125"],
    Honda: ["Beat FI", "Sonic RS 150FI", "Click i125", "ADV 160"],
    Suzuki: ["Raider 150FI", "GSX 150", "Smash 115FI", "Skydrive 125 FI"],
    Kawasaki: ["Rouser NS125 FI", "Ninja 250", "Rouser NS200 FI", "Brusky i125"],
  };

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to view this page.");
      navigate("/login");
      return;
    }

    fetch(`http://localhost:3001/get-motorcycles?userId=${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setMotorcycles(data.motorcycles || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching motorcycles:", err);
        setLoading(false);
      });
  }, [navigate]);

  const handleSelectMotorcycle = (motorcycle) => {
  console.log("Selected motorcycle before saving:", motorcycle);
  localStorage.setItem("selectedMotorcycle", JSON.stringify(motorcycle));
  navigate("/dashboard");
};


  const handleChange = (e) => {
    setMotorcycleData({ ...motorcycleData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    // Validate all fields including new ones
    if (
      !motorcycleData.brand ||
      !motorcycleData.model ||
      !motorcycleData.year ||
      !motorcycleData.plateNumber ||
      motorcycleData.odometer === "" ||
      !motorcycleData.lastOilChangeDate
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/signup-motorcycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          brand: motorcycleData.brand,
          model: motorcycleData.model,
          year: motorcycleData.year,
          plateNumber: motorcycleData.plateNumber,
          odometer_km: parseInt(motorcycleData.odometer, 10),    // Use snake_case here
          last_oil_change: motorcycleData.lastOilChangeDate,     // Use snake_case here
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data?.message || "Signup successful!");
        navigate("/dashboard");
      } else {
        alert(data?.error || "Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup Motorcycle Error:", error);
      alert("Server error. Please try again.");
    }
  };

  const handleCancel = () => {
    if (motorcycles.length > 0) {
      setRegisterNew(false);
    } else {
      localStorage.removeItem("userId");
      alert("No motorcycles registered. Returning to login.");
      navigate("/login");
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupBox}>
        <h2>{motorcycles.length > 0 && !registerNew ? "Select Your Motorcycle" : "Register a New Motorcycle"}</h2>

        {loading ? (
          <p>Loading...</p>
        ) : motorcycles.length > 0 && !registerNew ? (
          <>
            {motorcycles.map((moto) => (
              <button
                key={moto.id}
                className={styles.motorcycleButton}
                onClick={() => handleSelectMotorcycle(moto)}
              >
                {moto.brand} {moto.model} ({moto.year})
              </button>
            ))}
            <button
              className={styles.registerNewButton}
              onClick={() => setRegisterNew(true)}
            >
              Register New Motorcycle
            </button>
          </>
        ) : (
          <form className={styles.signupForm} onSubmit={handleSubmit}>
            <label>Brand</label>
            <select
              name="brand"
              required
              onChange={handleChange}
              value={motorcycleData.brand}
            >
              <option value="">Select a Brand</option>
              {Object.keys(brandModels).map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <label>Model</label>
            <select
              name="model"
              required
              onChange={handleChange}
              value={motorcycleData.model}
              disabled={!motorcycleData.brand}
            >
              <option value="">Select a Model</option>
              {motorcycleData.brand &&
                brandModels[motorcycleData.brand]?.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
            </select>

            <label>Year</label>
            <input
              type="number"
              name="year"
              placeholder="e.g., 2024"
              required
              onChange={handleChange}
              value={motorcycleData.year}
            />

            <label>Plate Number</label>
            <input
              type="text"
              name="plateNumber"
              placeholder="e.g., ABC-1234"
              required
              onChange={handleChange}
              value={motorcycleData.plateNumber}
            />

            <label>Odometer (km)</label>
            <input
              type="number"
              name="odometer"
              placeholder="e.g., 12000"
              required
              onChange={handleChange}
              value={motorcycleData.odometer}
            />

            <label>Date of Last Oil Change</label>
            <input
              type="date"
              name="lastOilChangeDate"
              required
              onChange={handleChange}
              value={motorcycleData.lastOilChangeDate}
            />

            <button className={styles.submitButton} type="submit">
              Submit
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default SignupMotorcycle;

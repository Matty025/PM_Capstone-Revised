import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Reports.css";
import { Colors } from "chart.js";

const Reports = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [oilHistory, setOilHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [odoInput, setOdoInput] = useState("");
  const [dateInput, setDateInput] = useState("");

  /* ───────── helpers ───────── */
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar  = () => setSidebarOpen(false);
  const handleLogout  = () => { localStorage.clear(); navigate("/"); };

  /* ───────── fetch history ─── */
  const fetchOilHistory = async () => {
    const motorcycle = JSON.parse(localStorage.getItem("selectedMotorcycle"));
    if (!motorcycle) {
      toast.error("No motorcycle selected.");
      navigate("/signup-motorcycle");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3001/oil-history?motorcycle_id=${motorcycle.id}`);
      setOilHistory(res.data);
      setErrorMsg("");
    } catch (err) {
      console.error(err);
      setErrorMsg("Could not fetch oil change history.");
      toast.error("Failed to fetch oil change history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOilHistory(); }, []);

  /* ───────── modal control ─── */
  const openModal = () => {
    setOdoInput("");
    setDateInput("");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const motorcycle = JSON.parse(localStorage.getItem("selectedMotorcycle"));
    if (!motorcycle) return;

    const odometer_km = parseInt(odoInput, 10);
    if (isNaN(odometer_km)) {
      toast.warn("Enter a valid odometer number.");
      return;
    }

    const lastOdo = oilHistory[0]?.odometer_at_change || 0;
    if (odometer_km <= lastOdo) {
      toast.warn(`Odometer must be > ${lastOdo} km.`);
      return;
    }

    try {
      await axios.post("http://localhost:3001/oil-change", {
        motorcycle_id: motorcycle.id,
        odometer_km,
        date_of_oil_change: dateInput || new Date().toISOString().split("T")[0],
      });

      toast.success("Oil change logged!");
      setModalOpen(false);
      fetchOilHistory();

      const diff = odometer_km - lastOdo;
      if (diff >= 1000) toast.info("⛽ Time to change your oil (1000 km reached).");
    } catch (err) {
      console.error(err);
      toast.error("Failed to log oil change.");
    }
  };

  /* ───────── render history ─ */
  const renderOilHistory = () => (
    <div className="reportItem">
      <h3>Oil Change History</h3>
      {errorMsg && <p className="error">{errorMsg}</p>}
      {loading ? (
        <p>Loading oil change history...</p>
      ) : oilHistory.length === 0 ? (
        <p>No oil change history available.</p>
      ) : (
        <table className="oilTable">
          <thead>
            <tr><th>Date</th><th>Odometer (km)</th></tr>
          </thead>
          <tbody>
            {oilHistory.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.date_of_oil_change).toLocaleDateString()}</td>
                <td>{entry.odometer_at_change}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="logBtn" onClick={openModal}>
        Insert Current Odometer
      </button>
    </div>
  );

  /* ───────── component JSX ─ */
  return (
    <div className="dashboardContainers">
      {!sidebarOpen && (
        <button className="hamburger1" onClick={toggleSidebar}>☰</button>
      )}

      <div className={`dashboardSidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="closeBtn" onClick={closeSidebar}>✖</button>

        <button className="profileBtn" onClick={() => navigate("/profile")}>
          <img
            src="https://static.vecteezy.com/system/resources/previews/025/267/725/non_2x/portrait-of-a-man-wearing-a-motocross-rider-helmet-and-wearing-a-sweater-side-view-suitable-for-avatar-social-media-profile-print-etc-flat-graphic-vector.jpg"
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

      {sidebarOpen && <div className="backdrop visible" onClick={closeSidebar}></div>}

      <div className="dashboardContent">
        <div className="reportsContainer">
          <h2>Oil Change and Reports</h2>
          {renderOilHistory()}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>Log Oil Change</h3>
            <label>Current Odometer (km)</label>
            <input
              type="number"
              value={odoInput}
              onChange={(e) => setOdoInput(e.target.value)}
              placeholder="e.g. 12000"
            />
            <label>Date of Oil Change</label>
            <input
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
            <div className="modalButtons">
              <button onClick={handleSubmit} style={{ backgroundColor: "green", color: "white" }}>Submit</button>
              <button className="cancelBtn" onClick={() => setModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast container */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};

export default Reports;

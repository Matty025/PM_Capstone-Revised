import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function PredictiveMaintenance() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [darkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "true";
    });

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
    }, [darkMode]);

    const handleLogout = () => {
        navigate("/");
    };

    return (
        <div className={`dashboardContainer ${darkMode ? "dark" : ""}`}>
            {/* Hamburger Button for Mobile */}
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>
                ☰
            </button>

            {/* Sidebar Navigation */}
            <div className={`dashboardSidebar ${sidebarOpen ? "open" : ""}`}>
                <button className="closeBtn" onClick={() => setSidebarOpen(false)}>
                    ✖
                </button>

                <button className="profileBtn" onClick={() => navigate("/profile")}>
                    <img 
                        src="https://static.vecteezy.com/system/resources/previews/025/267/725/non_2x/portrait-of-a-man-wearing-a-motocross-rider-helmet-and-wearing-a-sweater-side-view-suitable-for-avatar-social-media-profile-print-etc-flat-graphic-vector.jpg" 
                        alt="Profile" 
                        className="profileImage" 
                    />
                    <h3 className="profileLabel">Profile</h3>
                </button>
                <button onClick={() => navigate("/dashboard")}>Dashboard</button>
                <button onClick={() => navigate("/reports")}>Reports</button>
                <button onClick={() => navigate("/predictivemaintenance")}>Preventive Maintenance</button>
                <button onClick={() => navigate("/alerts")}>Alerts</button>
                <button onClick={() => navigate("/settings")}>Settings</button>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {/* Backdrop for Closing Sidebar */}
            {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)}></div>}

            <div className="dashboardContent">
                <h2>Preventive Maintenance</h2>

                <div className="predictiveContainer">
                    <div className="maintenanceCard">
                        <h3>Engine Temperature</h3>
                        <p>Status: Normal</p>
                    </div>

                    <div className="maintenanceCard">
                        <h3>Vibration Pattern</h3>
                        <p>Status: Slight Irregularity Detected</p>
                    </div>

                    <div className="maintenanceCard">
                        <h3>Ignition Timing</h3>
                        <p>Status: Optimal</p>
                    </div>

                    <div className="maintenanceCard">
                        <h3>Next Predicted Maintenance</h3>
                        <p>Oil Change Suggested in 5 Days</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PredictiveMaintenance;

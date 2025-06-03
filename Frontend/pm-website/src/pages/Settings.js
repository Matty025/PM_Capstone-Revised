import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

function Settings() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem("darkMode") === "true";
    });

    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
        localStorage.setItem("darkMode", darkMode);
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
    src="https://static.vecteezy.com/system/resources/previews/025/267/725/non_2x/portrait-of-a-man-wearing-a-motocross-rider-helmet-and-wearing-a-sweater-side-view-suitable-for-avatar-social-media-profile-print-etc-flat-graphic-vector.jpg   " 
    alt="Profile" 
    className="profileImage" 
  />
  <h3 className="profileLabel">Profile</h3>
</button>
                <button onClick={() => navigate("/dashboard")}>Dashboard</button>
                <button onClick={() => navigate("/reports")}>Reports</button>
                <button onClick={() => navigate("/predictivemaintenance")}>Predictive Maintenance</button>
                <button onClick={() => navigate("/alerts")}>Alerts</button>
                <button onClick={() => navigate("/settings")}>Settings</button>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {/* Backdrop for Closing Sidebar */}
            {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)}></div>}

            <div className="dashboardContent">
                <h2>Settings</h2>
                <p>Manage preferences and system settings.</p>

                <div className="settingsContainer">
                    <div className="settingOption">
                        <label>Enable Notifications</label>
                        <input
                            type="checkbox"
                            checked={notifications}
                            onChange={() => setNotifications(!notifications)}
                        />
                    </div>

                    <div className="settingOption">
                        <label>Dark Mode</label>
                        <input
                            type="checkbox"
                            checked={darkMode}
                            onChange={() => setDarkMode(!darkMode)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;

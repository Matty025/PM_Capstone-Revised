import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Alerts.css";  

function Alerts() {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout   = () => {       
        navigate("/");  
    };

    return (
        <div className="dashboardContainer">
            {/* Hamburger Menu */}
            <button className="hamburger" onClick={() => setSidebarOpen(true)} style={{ display: sidebarOpen ? "none" : "block" }}>☰ </button>
            {/* Sidebar */}
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
                <button onClick={() => navigate("/predictivemaintenance")}>Preventive Maintenance</button>
                <button onClick={() => navigate("/alerts")}>Alerts</button>
                <button onClick={() => navigate("/settings")}>Settings</button>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {/* Backdrop */}
            {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)}></div>}

            {/* Main Content */}
            <div className="dashboardContent">
                <h2>Alerts & Notifications</h2>
                <p>Manage your alerts and notifications here.</p>
            </div>
        </div>
    );
}

export default Alerts;

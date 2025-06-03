import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Reports.css";

const Reports = () => {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [dailyReport, setDailyReport] = useState(null);
    const [weeklyReport, setWeeklyReport] = useState(null);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
    };

    const fetchReports = useCallback(async () => {
        const motorcycle = JSON.parse(localStorage.getItem("selectedMotorcycle"));
        if (!motorcycle) {
            alert("No motorcycle selected.");
            navigate("/signup-motorcycle");
            return;
        }

        try {
            const [dailyRes, weeklyRes] = await Promise.all([
                axios.get(`http://localhost:5000/reports/daily?motorcycle_id=${motorcycle.id}`),
                axios.get(`http://localhost:5000/reports/weekly?motorcycle_id=${motorcycle.id}`)
            ]);

            setDailyReport(dailyRes.data);
            setWeeklyReport(weeklyRes.data);
        } catch (err) {
            console.error("Error fetching reports:", err);
        }
    }, [navigate]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const renderReport = (title, data) => (
        <div className="reportItem">
            <h3>{title}</h3>
            {data ? (
                <ul>
                    <li><strong>Avg RPM:</strong> {data.avg_rpm}</li>
                    <li><strong>Avg Speed:</strong> {data.avg_speed} km/h</li>
                    <li><strong>Avg Coolant Temp:</strong> {data.avg_coolant_temp} °C</li>
                    <li><strong>Avg Voltage:</strong> {data.avg_voltage} V</li>
                </ul>
            ) : (
                <p>Loading...</p>
            )}
        </div>
    );

    return (
        <div className="dashboardContainers">
            {!sidebarOpen && (
                <button className="hamburger1" onClick={toggleSidebar}>
                    &#9776;
                </button>
            )}

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
                <button onClick={() => navigate("/Reports")}>Reports</button>
                <button onClick={() => navigate("/predictivemaintenance")}>Preventive Maintenance</button>
                <button onClick={() => navigate("/alerts")}>Alerts</button>
                <button onClick={() => navigate("/Settings")}>Settings</button>
                <button onClick={handleLogout}>Logout</button>
            </div>

            {sidebarOpen && <div className="backdrop visible" onClick={closeSidebar}></div>}

            <div className="dashboardContent">
                <div className="reportsContainer">
                    <h2>Reports</h2>
                    <div className="reportSections">
                        {renderReport("Daily Report", dailyReport)}
                        {renderReport("Weekly Report", weeklyReport)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;

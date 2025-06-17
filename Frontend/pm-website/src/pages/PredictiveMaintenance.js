// PredictiveMaintenance.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PredictiveMaintenance.css";

/* ---------- helpers ---------- */
function downloadCSV(rows, fileName = "maintenance.csv") {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",");
  const csv = [header, ...rows.map(r => Object.values(r).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const normalizeBrand = str =>
  (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")            // spaces → _
    .replace(/^_|_$/g, "");                 // trim _

/* -------------------------------- */

function PredictiveMaintenance() {
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [minutes,       setMinutes]       = useState(30);
  const [autoRefresh,   setAutoRefresh]   = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [rows,          setRows]          = useState([]);
  const [analysis,      setAnalysis]      = useState(null);
  const intervalRef = useRef(null);

  /* ───────────────────────── initial load ───────────────────────── */
  useEffect(() => {
    const selected = JSON.parse(localStorage.getItem("selectedMotorcycle"));
    if (!selected) {
      alert("No motorcycle selected.");
      navigate("/signup-motorcycle");
      return;
    }
    fetchRows(selected.motorcycle_id || selected.id, minutes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ──────────────────────── auto‑refresh timer ─────────────────── */
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        const sel = JSON.parse(localStorage.getItem("selectedMotorcycle"));
        if (sel) fetchRows(sel.motorcycle_id || sel.id, minutes, { silent: true });
      }, 30_000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, minutes]);

  /* ────────────────────────── REST helpers ─────────────────────── */
  const fetchRows = async (motorcycle_id, mins, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:5000/recent-data", {
        motorcycle_id,
        minutes: mins,
      });
      if (data.status === "ok") {
        setRows(data.rows);
        setAnalysis(null);          // clear previous ML result
      }
    } catch (err) {
      console.error(err);
      alert("Failed to load data");
    } finally {
      if (!silent) setLoading(false);
    }
  };
// this is the function for buttons 
  const handleTrainModel = async () => {
  const selectedMotorcycle = JSON.parse(localStorage.getItem('selectedMotorcycle'));
  
  if (!selectedMotorcycle) {
    alert("No motorcycle selected.");
    return;
  }

  const motorcycle_id = selectedMotorcycle.id;
  const brand = selectedMotorcycle.brand;

  try {
    const response = await fetch("http://localhost:5000/train_model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ motorcycle_id, brand })
    });

    const result = await response.json();

    if (result.status === "success") {
      alert("✅ Model trained and saved!\n" + result.message);
    } else {
      alert("❌ Error:\n" + result.message);
    }
  } catch (err) {
    console.error("Error training model:", err);
    alert("🚫 Failed to train model.");
  }
};


 const runPrediction = async () => {
  const selected = JSON.parse(localStorage.getItem("selectedMotorcycle"));
  const id = selected?.motorcycle_id || selected?.id;

  if (!id || !selected) return;

  const modelName = `${selected.brand}_${selected.model}`.toLowerCase().replace(/\s+/g, "_");

  setLoading(true);
  try {
    const { data } = await axios.post("http://localhost:5000/predict", {
      motorcycle_id: id,
      model: modelName, // send the model string
    });
    setAnalysis(data);
    setRows([]);
  } catch (err) {
    console.error(err);
    alert("Prediction failed.");
  } finally {
    setLoading(false);
  }
};

  /* ───────────────────────── logout helper ─────────────────────── */
  const handleLogout = () => {
    localStorage.removeItem("selectedMotorcycle");
    navigate("/");
  };

  /* ──────────────────────────── UI ─────────────────────────────── */
  return (
    <div className="dashboardContainer">
      {/* hamburger */}
      <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>

      {/* sidebar */}
      <div className={`dashboardSidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="closeBtn" onClick={() => setSidebarOpen(false)}>✖</button>

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
        <button onClick={() => navigate("/predictivemaintenance")}>Preventive&nbsp;Maintenance</button>
        <button onClick={() => navigate("/alerts")}>Alerts</button>
        <button onClick={() => navigate("/Settings")}>Settings</button>
        <button onClick={handleLogout}>Logout</button>
      </div>
      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

      {/* main */}
      <div className="dashboardContent space-y-6">

        {/* control bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-semibold mr-auto">Preventive Maintenance</h2>

          <label className="text-sm">
            Last&nbsp;
            <input
              type="number"
              className="border w-16 text-center"
              value={minutes}
              min={1}
              onChange={e => setMinutes(Number(e.target.value))}
            />
            &nbsp;min
          </label>

          <button
            className="px-3 py-1 bg-slate-200 rounded hover:bg-slate-300"
            onClick={() => {
              const sel = JSON.parse(localStorage.getItem("selectedMotorcycle"));
              if (sel) fetchRows(sel.motorcycle_id || sel.id, minutes);
            }}
          >
            🔄 Refresh
          </button>

          <label className="text-sm flex items-center gap-1">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
            />
            auto‑refresh
          </label>

          <button
            className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded"
            onClick={runPrediction}
          >
            🔍 Analyze
          </button>
          <button onClick={handleTrainModel} className="train-model-btn">
            Save Idle Model
          </button>

          <button
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-1 px-3 rounded"
            disabled={!rows.length}
            onClick={() => downloadCSV(rows)}
          >
            ⬇️ CSV
          </button>
        </div>

        {/* table or ML card */}
        {loading ? (
          <p>Loading…</p>
        ) : analysis ? (
          <div
            className={`p-4 rounded border
              ${analysis.status === "error"            ? "border-red-400 bg-red-100"
                : analysis.anomaly_percent > 10        ? "border-red-400 bg-red-100"
                : analysis.anomaly_percent > 3         ? "border-yellow-400 bg-yellow-100"
                :                                         "border-green-400 bg-green-100"}`}
          >
            <h3 className="font-semibold mb-1">ML Suggestion</h3>
            <p>{analysis.suggestion}</p>
            {"anomaly_percent" in analysis && (
              <p className="text-xs italic mt-1">
                {analysis.anomaly_percent.toFixed(2)} % of readings are anomalous
              </p>
            )}
          </div>
        ) : rows.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rows[0]).map(h => (
                    <th key={h} className="border px-1">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="border px-1">
                        {j === 0 ? new Date(v).toLocaleString() : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No data in selected window.</p>
        )}
      </div>
    </div>
  );
}

export default PredictiveMaintenance;

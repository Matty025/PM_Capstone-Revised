# FI Motorcycle Predictive Maintenance System

An IoT-enabled predictive maintenance platform for Fuel Injected motorcycles that leverages machine learning and real-time OBD-II data analysis to detect anomalies and prevent mechanical failures.

## 🎯 Overview

This capstone project combines IoT sensors, cloud infrastructure, and machine learning to provide motorcycle owners with intelligent maintenance insights. The system collects real-time engine telemetry via OBD-II diagnostics, analyzes it for anomalies, and generates predictive maintenance reports.

## 🏗️ Architecture

### Backend
- **Flask REST API** - Handles requests for anomaly detection and reports
- **MQTT Broker** - Real-time data streaming via HiveMQ
- **InfluxDB** - Time-series data storage for OBD metrics
- **ML Models** - Python-based anomaly detection and idle model training
- **Multi-Motorcycle Support** - Pre-trained models for Honda and Yamaha vehicles

### Frontend
- **React Dashboard** - Real-time visualization of motorcycle health metrics
- **Authentication** - User login, signup, and profile management
- **Interactive Charts** - Chart.js and Recharts for data visualization
- **Responsive Design** - Works across desktop and mobile devices

## 🔧 Tech Stack

**Backend:**
- Python (Flask, scikit-learn, joblib)
- MQTT (Paho)
- InfluxDB
- Node.js (Express for auxiliary services)

**Frontend:**
- React 19
- React Router DOM
- Chart.js & Recharts
- Axios (HTTP client)

## 📊 Key Features

- **Real-time OBD-II Data Collection** - Connects to vehicle diagnostics port
- **Anomaly Detection** - ML models trained on normal operation ranges
- **Predictive Maintenance Reports** - Daily and weekly health summaries
- **Multi-User Platform** - Manage multiple motorcycles per account
- **Normalized Analytics** - Brand and model-specific normal value ranges
- **Historical Data Analysis** - Track trends and predict failures

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- InfluxDB running locally or cloud instance
- MQTT broker access (HiveMQ configured)
- OBD-II Bluetooth adapter

### Installation

**Backend Setup:**
```bash
cd Backend
pip install -r requirements.txt
python server.py
```

**Frontend Setup:**
```bash
cd Frontend/pm-website
npm install
npm start
```

### Configuration
Update these files with your environment values:
- `Backend/obddata.py` - InfluxDB credentials and MQTT settings
- `Backend/normal_ranges.json` - Motorcycle-specific normal operating ranges

## 📈 Data Flow

1. OBD-II adapter → Vehicle telemetry
2. Python OBD script → MQTT publish
3. Flask backend → Receives via MQTT subscription
4. Anomaly detection → Classify as normal/warning/critical
5. InfluxDB → Store time-series data
6. React dashboard → Visualize metrics and alerts
7. Report API → Generate maintenance recommendations

## 🤖 Machine Learning

- **Anomaly Detection**: Compares real-time values against trained normal ranges
- **Idle Model Training**: `train_idle_model.py` generates vehicle-specific baselines
- **Classification**: Critical/Warning/Normal severity levels per parameter

## 📝 Project Structure

```
├── Backend/
│   ├── server.py          # Flask API
│   ├── obddata.py         # OBD-II data collection
│   ├── anomaly_model.py   # ML anomaly detection
│   ├── influx_query.py    # Database queries
│   ├── report_api.py      # Report generation
│   ├── models/            # Pre-trained ML models (Honda, Yamaha)
│   └── normal_ranges.json # Reference data
└── Frontend/
    └── pm-website/        # React application
        ├── src/
        │   ├── pages/     # Dashboard, Reports, Profile, etc.
        │   └── components/# Reusable UI components
        └── package.json
```

## 🔒 Security Considerations

- MQTT over TLS recommended for production
- Secure InfluxDB token management
- User authentication for sensitive data
- Input validation on all API endpoints

## 📄 License

Capstone Project - Educational Use

---

**Questions or contributions?** Feel free to explore the code and submit improvements!

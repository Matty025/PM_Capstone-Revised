"""
anomaly_model.py
────────────────
 • One generic entry‑point  →  detect_anomalies(motorcycle_id, brand, mode='idle')
 • Each brand / mode has its own model file:  <brand>/<mode>.pkl
 • <mode>.pkl is expected to be a dict  {"model": fitted_model, "scaler": fitted_scaler}
"""

import os
import joblib
import numpy as np
import pandas as pd
from functools   import lru_cache
from influxdb_client import InfluxDBClient


# ──────────────────────────────────────────────────────────
# InfluxDB configuration (adjust if needed)
# ──────────────────────────────────────────────────────────
INFLUXDB_URL    = "http://localhost:8086"
INFLUXDB_TOKEN  = "y2gPcpacMB5yTLjeEuYVe7lR2AWjN_3p9R29XsHWYkuozvV-TzzJVi5u8Z1G3YwtXXPQBXOXaYc8fM1-wWOfzw=="
INFLUXDB_ORG    = "MotorcycleMaintenance"
INFLUXDB_BUCKET = "MotorcycleOBDData"

# Feature order used during training ── keep consistent
FEATURES = [
    "rpm",
    "engine_load",
    "throttle_pos",
    "long_fuel_trim_1",
    "coolant_temp",
    "elm_voltage",
]

# ──────────────────────────────────────────────────────────
# Helper: fetch & tidy a recent window from InfluxDB
# ──────────────────────────────────────────────────────────
def _get_window_df(motorcycle_id: str, minutes: int = 30) -> pd.DataFrame:
    flux = f"""
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: -{minutes}m)
      |> filter(fn:(r)=>r._measurement == "obd_data")
      |> filter(fn:(r)=>r.motorcycle_id == "{motorcycle_id}")
      |> filter(fn:(r)=>r._field == "rpm"
                    or r._field == "engine_load"
                    or r._field == "throttle_pos"
                    or r._field == "long_fuel_trim_1"
                    or r._field == "coolant_temp"
                    or r._field == "elm_voltage")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> keep(columns: ["_time"] + [{', '.join(f'"{f}"' for f in FEATURES)}])
    """

    client    = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
    query_api = client.query_api()
    df        = query_api.query_data_frame(flux)

    client.close()

    if df.empty:
        return pd.DataFrame()

    df = df.drop(columns=["result", "table"], errors="ignore")
    df = df.dropna().sort_values("_time").reset_index(drop=True)
    return df


# ──────────────────────────────────────────────────────────
# Helper: cache model/scaler objects so we load each file once
# ──────────────────────────────────────────────────────────
@lru_cache(maxsize=None)
def _load_model(brand: str, mode: str = "idle"):
    path = os.path.join(brand, f"{mode}.pkl")
    if not os.path.exists(path):
        raise FileNotFoundError(f"Model file not found: {path}")

    data = joblib.load(path)
    if not isinstance(data, dict) or "model" not in data or "scaler" not in data:
        raise ValueError(f"{path} does not contain the expected keys {{'model','scaler'}}")

    return data["model"], data["scaler"]


# ──────────────────────────────────────────────────────────
# Main entry‑point
# ──────────────────────────────────────────────────────────
def detect_anomalies(motorcycle_id: str, brand: str, mode: str = "idle", minutes: int = 30):
    """
    Returns a dict ready to JSON‑dump:
      {
        status, motorcycle_id, anomalies_detected, anomaly_percent,
        threshold, suggestion
      }
    """
    try:
        df = _get_window_df(motorcycle_id, minutes)
        if df.empty or len(df) < 30:
            return {
                "status": "not enough data",
                "motorcycle_id": motorcycle_id,
                "anomalies_detected": 0,
                "anomaly_percent": 0.0,
            }

        model, scaler = _load_model(brand, mode)

        X_scaled = scaler.transform(df[FEATURES])
        # Build sliding 30‑row sequences the same way you trained
        SEQ = 30
        sequences = np.stack([X_scaled[i : i + SEQ] for i in range(len(X_scaled) - SEQ + 1)])

        preds = model.predict(sequences)
        mse   = np.mean((sequences - preds) ** 2, axis=(1, 2))

        threshold        = np.mean(mse) + 2 * np.std(mse)
        anomaly_mask     = mse > threshold
        anomaly_count    = int(anomaly_mask.sum())
        anomaly_percent  = 100.0 * anomaly_count / len(anomaly_mask)

        # simple suggestion text
        suggestion = (
            "Check engine – high anomaly rate"
            if anomaly_percent > 10
            else "Some irregularities, keep monitoring"
            if anomaly_count > 0
            else "All parameters within learned idle pattern"
        )

        return {
            "status": "analyzed",
            "motorcycle_id": motorcycle_id,
            "anomalies_detected": anomaly_count,
            "anomaly_percent": anomaly_percent,
            "threshold": float(threshold),
            "suggestion": suggestion,
        }

    except Exception as exc:
        return {
            "status": "error",
            "motorcycle_id": motorcycle_id,
            "error_message": str(exc),
        }


# ──────────────────────────────────────────────────────────
# Quick CLI test
# ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(detect_anomalies("2", brand="honda_click_i125", mode="idle"))

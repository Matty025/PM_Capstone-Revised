"""
Train an Isolation‑Forest model on idle data for ONE motorcycle.

Run:
    python train_idle_model.py --motorcycle_id <id> --brand "Honda" --minutes 720
"""

import argparse
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler              # or MinMaxScaler
from influxdb_client import InfluxDBClient, Point, Dialect

# ────────────────────────────────────────────────────────────
# 1) CLI arguments
# ────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description="Train idle anomaly model")
parser.add_argument("--motorcycle_id", required=True, help="e.g. 2 or moto_001")
parser.add_argument("--brand",          default="Generic",    help="Folder name (brand)")
parser.add_argument("--minutes", type=int, default=60*24,     help="How far back to pull data (default 1 day)")
args = parser.parse_args()

MOTO_ID = args.motorcycle_id
BRAND    = args.brand.strip().replace(" ", "_").lower()       # folder safe
MODE     = "idle"                                             # you can change
MINUTES  = args.minutes

# ────────────────────────────────────────────────────────────
# 2) InfluxDB connection
#    (edit these for your setup)
INFLUXDB_URL = "http://localhost:8086"
INFLUXDB_TOKEN = "y2gPcpacMB5yTLjeEuYVe7lR2AWjN_3p9R29XsHWYkuozvV-TzzJVi5u8Z1G3YwtXXPQBXOXaYc8fM1-wWOfzw=="
INFLUXDB_ORG = "MotorcycleMaintenance"
INFLUXDB_BUCKET = "MotorcycleOBDData"
client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
query_api = client.query_api()

# ────────────────────────────────────────────────────────────
# 3) Query & clean data
# ────────────────────────────────────────────────────────────
flux = f'''
from(bucket: "{INFLUXDB_BUCKET}")
  |> range(start: -{MINUTES}m)
  |> filter(fn: (r) => r["_measurement"] == "obd_data")
  |> filter(fn: (r) => r["motorcycle_id"] == "{MOTO_ID}")
  |> filter(fn: (r) =>
      r["_field"] == "rpm" or
      r["_field"] == "engine_load" or
      r["_field"] == "throttle_pos" or
      r["_field"] == "long_fuel_trim_1" or
      r["_field"] == "coolant_temp"  or
      r["_field"] == "elm_voltage")
  |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> keep(columns: ["_time","rpm","engine_load","throttle_pos",
                    "long_fuel_trim_1","coolant_temp","elm_voltage"])
'''

df = query_api.query_data_frame(org=INFLUXDB_ORG, query=flux)
client.close()

if df.empty or len(df) < 60:        # at least 1 minute of 1 Hz data
    raise RuntimeError("Not enough idle data to train a model!")

df = df.drop(columns=["result","table"], errors="ignore")
df = df.dropna().sort_values("_time").reset_index(drop=True)

FEATURES = ["rpm","engine_load","throttle_pos",
            "long_fuel_trim_1","coolant_temp","elm_voltage"]

X_raw = df[FEATURES].values

# ────────────────────────────────────────────────────────────
# 4) Scale & train Isolation Forest
# ────────────────────────────────────────────────────────────
scaler = StandardScaler().fit(X_raw)
X = scaler.transform(X_raw)

model = IsolationForest(
    n_estimators=200,
    contamination=0.05,       # tweak to your taste
    random_state=42
).fit(X)

# ────────────────────────────────────────────────────────────
# 5) Save {model + scaler} → brand/<mode>.pkl
# ────────────────────────────────────────────────────────────
out_dir  = os.path.join(BRAND)
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, f"{MODE}.pkl")

joblib.dump({"model": model, "scaler": scaler}, out_path, compress=3)

print(f"✅  Model trained on {len(df)} rows")
print(f"📝  Saved to → {out_path}")

from influxdb_client import InfluxDBClient

# Assuming you already have these set:
INFLUXDB_URL = "http://localhost:8086"
INFLUXDB_TOKEN = "y2gPcpacMB5yTLjeEuYVe7lR2AWjN_3p9R29XsHWYkuozvV-TzzJVi5u8Z1G3YwtXXPQBXOXaYc8fM1-wWOfzw=="
INFLUXDB_ORG = "MotorcycleMaintenance"
INFLUXDB_BUCKET = "MotorcycleOBDData"

client = InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG)
query_api = client.query_api()

def get_recent_data(motorcycle_id, minutes=10):
    """
    Fetch recent data for the given motorcycle ID within the last X minutes.
    Returns a list of dicts for each row of sensor data.
    """
    time_range = f"-{minutes}m"
    
    query = f'''
    from(bucket: "{INFLUXDB_BUCKET}")
      |> range(start: {time_range})
      |> filter(fn: (r) => r["_measurement"] == "obd_data")
      |> filter(fn: (r) => r["motorcycle_id"] == "{motorcycle_id}")
      |> filter(fn: (r) => 
          r["_field"] == "rpm" or
          r["_field"] == "engine_load" or
          r["_field"] == "throttle_pos" or
          r["_field"] == "long_fuel_trim_1" or
          r["_field"] == "coolant_temp" or
          r["_field"] == "elm_voltage")
      |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> keep(columns: ["_time", "rpm", "engine_load", "throttle_pos", "long_fuel_trim_1", "coolant_temp", "elm_voltage"])
    '''

    result = query_api.query_data_frame(org=INFLUXDB_ORG, query=query)

    if result.empty:
        return []

    # Clean up columns from the result DataFrame
    result = result.drop(columns=["result", "table"], errors="ignore")

    # Convert to list of dicts
    records = result.to_dict("records")

    return records

import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Severity color mapping
const getColor = (severity) => ({
  normal: "#00c49f",
  warning: "#ffbb28",
  critical: "#ff4d4f",
}[severity] || "#8884d8");

// Prepare data format for chart
const prepareData = (rows, feature) => {
  return rows
    .map((row, i) => ({
      time: new Date(row.values._time).toLocaleTimeString(),
      value: row.values?.[feature] ?? null,
      severity: row.severity?.[feature] ?? "normal",
      index: i + 1,
    }))
    .filter((d) => d.value !== null);
};

const RowAnomalyLineChart = ({ rowAnomalies, feature }) => {
  const data = prepareData(rowAnomalies, feature);

  if (!data.length) {
    return (
      <p className="text-sm italic text-gray-500">
        No anomalies found for {feature}.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <h4 className="text-gray-800 font-semibold mb-2">
        {feature.toUpperCase()} Anomalies 
        <span className="text-xs text-gray-600 flex gap-2 items-center ml-4">
      <span className="flex items-center gap-1">
        🔴 <span>Critical</span>
      </span>
      <span className="flex items-center gap-1">
        🟡 <span>Warning</span>
      </span>
    </span>
      </h4>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="time"
            type="category"
            interval="preserveStartEnd"
            tick={{ fontSize: 10 }}
          />
          <YAxis dataKey="value" />
       <Tooltip
  labelFormatter={(label) => `Time: ${label}`}
  formatter={(value, name, props) => {
    const sev = props.payload?.severity;
    let severityLabel = '';

    if (sev === 'critical') severityLabel = '🔴 Critical';
    else if (sev === 'warning') severityLabel = '🟡 Warning';
    else severityLabel = 'Normal';

    return [`${value} (${severityLabel})`, feature.toUpperCase()];
  }}
/>

          <Legend />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#8884d8"
            name={`${feature.toUpperCase()} Value`}
            dot={({ cx, cy, payload }) => {
              const sev = payload.severity;
              if (sev === "normal") return null;

              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={getColor(sev)}
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Custom dot severity legend */}
    
    </div>
  );
};

export default RowAnomalyLineChart;

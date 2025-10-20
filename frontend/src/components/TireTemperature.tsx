import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { useRaceStore } from "../store/useRaceStore";
import { CircleDot } from "lucide-react";

export function TireTemperature() {
  const telemetryData = useRaceStore((state) => state.telemetryData);

  // Transform data to include all tire temps
  const chartData = telemetryData.map((point) => ({
    distance: point.distance,
    frontLeft: point.tireTemps.frontLeft,
    frontRight: point.tireTemps.frontRight,
    rearLeft: point.tireTemps.rearLeft,
    rearRight: point.tireTemps.rearRight,
  }));

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-2.5 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <h2 className="f1-text text-white flex items-center gap-2 text-sm">
          <CircleDot className="w-4 h-4" />
          Tire Temperature
        </h2>
      </div>

      {/* Chart */}
      <div className="flex-1 p-3 min-h-0 w-full" style={{ minHeight: "400px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
            />
            <XAxis
              dataKey="distance"
              stroke="#888"
              style={{
                fontSize: "11px",
                fontFamily: "Formula1-Display-Regular",
              }}
              label={{
                value: "Distance (km)",
                position: "insideBottom",
                offset: -3,
                fill: "#888",
                fontSize: 11,
              }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis
              stroke="#888"
              style={{
                fontSize: "11px",
                fontFamily: "Formula1-Display-Regular",
              }}
              label={{
                value: "Temp (°C)",
                angle: -90,
                position: "insideLeft",
                fill: "#888",
                fontSize: 11,
              }}
              domain={[70, 110]}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(225,6,0,0.5)",
                borderRadius: "8px",
                fontFamily: "Formula1-Display-Regular",
                fontSize: "12px",
              }}
              labelStyle={{ color: "#fff" }}
              formatter={(value: number) => `${value.toFixed(1)}°C`}
            />
            <Legend
              wrapperStyle={{
                fontFamily: "Formula1-Display-Regular",
                fontSize: "10px",
              }}
              iconSize={8}
            />
            <ReferenceLine
              y={90}
              stroke="#00d2be"
              strokeDasharray="5 5"
              label={{
                value: "Optimal",
                fill: "#00d2be",
                fontSize: 9,
                position: "right",
              }}
            />
            <ReferenceLine
              y={105}
              stroke="#ffa500"
              strokeDasharray="5 5"
              label={{
                value: "Hot",
                fill: "#ffa500",
                fontSize: 9,
                position: "right",
              }}
            />
            <Line
              type="monotone"
              dataKey="frontLeft"
              stroke="#ff6b6b"
              strokeWidth={1.5}
              dot={false}
              name="Front Left"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="frontRight"
              stroke="#4ecdc4"
              strokeWidth={1.5}
              dot={false}
              name="Front Right"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rearLeft"
              stroke="#ffe66d"
              strokeWidth={1.5}
              dot={false}
              name="Rear Left"
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rearRight"
              stroke="#a8e6cf"
              strokeWidth={1.5}
              dot={false}
              name="Rear Right"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

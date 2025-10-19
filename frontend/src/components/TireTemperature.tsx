import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useRaceStore } from '../store/useRaceStore';
import { CircleDot } from 'lucide-react';

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
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-3 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <h2 className="f1-text text-white flex items-center gap-2">
          <CircleDot className="w-4 h-4" />
          Tire Temperature
        </h2>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="distance" 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Distance (km)', position: 'insideBottom', offset: -5, fill: '#888' }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', fill: '#888' }}
              domain={[70, 110]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(225,6,0,0.5)',
                borderRadius: '8px',
                fontFamily: 'Formula1-Display-Regular'
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => `${value.toFixed(1)}°C`}
            />
            <Legend 
              wrapperStyle={{ fontFamily: 'Formula1-Display-Regular', fontSize: '12px' }}
            />
            <ReferenceLine y={90} stroke="#00d2be" strokeDasharray="5 5" label={{ value: 'Optimal', fill: '#00d2be', fontSize: 10 }} />
            <ReferenceLine y={105} stroke="#ffa500" strokeDasharray="5 5" label={{ value: 'Hot', fill: '#ffa500', fontSize: 10 }} />
            <Line 
              type="monotone" 
              dataKey="frontLeft" 
              stroke="#ff6b6b" 
              strokeWidth={2}
              dot={false}
              name="Front Left"
            />
            <Line 
              type="monotone" 
              dataKey="frontRight" 
              stroke="#4ecdc4" 
              strokeWidth={2}
              dot={false}
              name="Front Right"
            />
            <Line 
              type="monotone" 
              dataKey="rearLeft" 
              stroke="#ffe66d" 
              strokeWidth={2}
              dot={false}
              name="Rear Left"
            />
            <Line 
              type="monotone" 
              dataKey="rearRight" 
              stroke="#a8e6cf" 
              strokeWidth={2}
              dot={false}
              name="Rear Right"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

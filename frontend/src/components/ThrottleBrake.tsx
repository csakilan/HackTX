import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRaceStore } from '../store/useRaceStore';
import { Gauge } from 'lucide-react';

export function ThrottleBrake() {
  const telemetryData = useRaceStore((state) => state.telemetryData);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-3 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <h2 className="f1-text text-white flex items-center gap-2">
          <Gauge className="w-4 h-4" />
          Throttle & Brake Pressure
        </h2>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              label={{ value: 'Pressure (%)', angle: -90, position: 'insideLeft', fill: '#888' }}
              domain={[0, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(225,6,0,0.5)',
                borderRadius: '8px',
                fontFamily: 'Formula1-Display-Regular'
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend 
              wrapperStyle={{ fontFamily: 'Formula1-Display-Regular', fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="throttle" 
              stroke="#00d2be" 
              strokeWidth={2}
              dot={false}
              name="Throttle"
            />
            <Line 
              type="monotone" 
              dataKey="brakePressure" 
              stroke="#e10600" 
              strokeWidth={2}
              dot={false}
              name="Brake Pressure"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

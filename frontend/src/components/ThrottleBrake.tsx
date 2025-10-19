import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useRaceStore } from '../store/useRaceStore';
import { Gauge } from 'lucide-react';
import { useEffect } from 'react';

export function ThrottleBrake() {
  const telemetryData = useRaceStore((state) => state.telemetryData);

  useEffect(() => {
    console.log('📊 Telemetry Data Updated:', telemetryData.length, 'points');
  }, [telemetryData]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-2.5 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <h2 className="f1-text text-white flex items-center gap-2 text-sm">
          <Gauge className="w-4 h-4" />
          Throttle & Brake Pressure
        </h2>
      </div>

      {/* Chart */}
      <div className="flex-1 p-3 min-h-0 w-full" style={{ minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetryData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="distance" 
              stroke="#888"
              style={{ fontSize: '11px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Distance (km)', position: 'insideBottom', offset: -3, fill: '#888', fontSize: 11 }}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '11px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Pressure (%)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11 }}
              domain={[0, 100]}
              width={45}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(225,6,0,0.5)',
                borderRadius: '8px',
                fontFamily: 'Formula1-Display-Regular',
                fontSize: '12px'
              }}
              labelStyle={{ color: '#fff' }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend 
              wrapperStyle={{ fontFamily: 'Formula1-Display-Regular', fontSize: '11px' }}
              iconSize={10}
            />
            <Line 
              type="monotone" 
              dataKey="throttle" 
              stroke="#00d2be" 
              strokeWidth={2}
              dot={false}
              name="Throttle"
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="brakePressure" 
              stroke="#e10600" 
              strokeWidth={2}
              dot={false}
              name="Brake Pressure"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

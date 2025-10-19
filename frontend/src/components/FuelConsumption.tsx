import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useRaceStore } from '../store/useRaceStore';
import { Fuel } from 'lucide-react';
import { useEffect, useMemo } from 'react';

export function FuelConsumption() {
  const currentLap = useRaceStore((state) => state.currentLap);

  // Generate dummy fuel data that decreases linearly from 20L to 0L over 20 laps
  const fuelData = useMemo(() => {
    const data = [];
    for (let lap = 1; lap <= 20; lap++) {
      // Linear decrease: 20L at lap 1, 0L at lap 20
      const fuel = 20 - (lap - 1);
      data.push({ lap, fuel });
    }
    return data;
  }, []);

  // Filter data to show only up to current lap
  const visibleData = useMemo(() => {
    return fuelData.filter(d => d.lap <= currentLap);
  }, [fuelData, currentLap]);

  useEffect(() => {
    console.log('📊 Fuel Graph - Current Lap:', currentLap, 'Data points:', visibleData.length);
  }, [currentLap, visibleData]);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-2.5 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <h2 className="f1-text text-white flex items-center gap-2 text-sm">
          <Fuel className="w-4 h-4" />
          Fuel Consumption
        </h2>
      </div>

      {/* Chart */}
      <div className="flex-1 p-3 min-h-0 w-full" style={{ minHeight: '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={visibleData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="lap" 
              stroke="#888"
              style={{ fontSize: '11px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Lap', position: 'insideBottom', offset: -3, fill: '#888', fontSize: 11 }}
              domain={[1, 20]}
              type="number"
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '11px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Fuel (L)', angle: -90, position: 'insideLeft', fill: '#888', fontSize: 11 }}
              domain={[0, 20]}
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
              itemStyle={{ color: '#00d2be' }}
              formatter={(value: any, name: string) => {
                if (name === 'fuel') {
                  return [`${Number(value).toFixed(1)} L`, 'Fuel'];
                }
                return [value, name];
              }}
            />
            <ReferenceLine y={5} stroke="#ffa500" strokeDasharray="5 5" label={{ value: 'Critical', fill: '#ffa500', fontSize: 10, position: 'right' }} />
            <ReferenceLine y={2} stroke="#e10600" strokeDasharray="5 5" label={{ value: 'Empty', fill: '#e10600', fontSize: 10, position: 'right' }} />
            <Line 
              type="monotone" 
              dataKey="fuel" 
              stroke="#00d2be" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

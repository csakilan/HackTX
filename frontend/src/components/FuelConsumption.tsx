import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useRaceStore } from '../store/useRaceStore';
import { Fuel } from 'lucide-react';

export function FuelConsumption() {
  const fuelData = useRaceStore((state) => state.fuelData);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-3 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <h2 className="f1-text text-white flex items-center gap-2">
          <Fuel className="w-4 h-4" />
          Fuel Consumption
        </h2>
      </div>

      {/* Chart */}
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={fuelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis 
              dataKey="lap" 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#888' }}
            />
            <YAxis 
              stroke="#888"
              style={{ fontSize: '12px', fontFamily: 'Formula1-Display-Regular' }}
              label={{ value: 'Fuel (kg)', angle: -90, position: 'insideLeft', fill: '#888' }}
              domain={[0, 120]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid rgba(225,6,0,0.5)',
                borderRadius: '8px',
                fontFamily: 'Formula1-Display-Regular'
              }}
              labelStyle={{ color: '#fff' }}
              itemStyle={{ color: '#00d2be' }}
            />
            <ReferenceLine y={30} stroke="#ffa500" strokeDasharray="5 5" label={{ value: 'Critical', fill: '#ffa500', fontSize: 10 }} />
            <ReferenceLine y={15} stroke="#e10600" strokeDasharray="5 5" label={{ value: 'Empty', fill: '#e10600', fontSize: 10 }} />
            <Line 
              type="monotone" 
              dataKey="fuel" 
              stroke="#00d2be" 
              strokeWidth={3}
              dot={{ fill: '#00d2be', r: 4 }}
              activeDot={{ r: 6, fill: '#00ff88' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

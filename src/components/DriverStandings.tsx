import { motion } from 'motion/react';
import { useRaceStore } from '../store/useRaceStore';

export function DriverStandings() {
  const drivers = useRaceStore((state) => state.drivers);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-3 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <h2 className="f1-text text-white">Live Standings</h2>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <table className="w-full h-full border-collapse table-fixed">
          {/* Table Header */}
          <thead>
            <tr className="bg-[#222]">
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[50px] overflow-hidden">
                POS
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[150px] overflow-hidden">
                DRIVER
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[80px] overflow-hidden">
                GAP
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[80px] overflow-hidden">
                INT
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[100px] overflow-hidden">
                LAST LAP
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody style={{ height: 'calc(100% - 40px)' }}>
            {drivers.map((driver, index) => (
              <motion.tr
                key={driver.position}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
                whileHover={{ backgroundColor: 'rgba(225, 6, 0, 0.1)' }}
                className="transition-colors relative group"
                style={{
                  borderLeft: `3px solid ${driver.teamColor}`,
                }}
              >
                {/* Position */}
                <td 
                  className="f1-text font-bold text-sm px-2 py-2 w-[50px] overflow-hidden align-middle"
                  style={{ 
                    color: driver.position === 1 ? '#e10600' : '#ffffff',
                    height: '10%'
                  }}
                >
                  <div className="truncate">{driver.position}</div>
                </td>

                {/* Driver Name */}
                <td className="px-2 py-2 w-[150px] overflow-hidden align-middle" style={{ height: '10%' }}>
                  <div className="truncate f1-text text-white text-xs font-medium">{driver.name}</div>
                  <div className="truncate text-[10px] uppercase tracking-wide" style={{ color: driver.teamColor }}>
                    {driver.team}
                  </div>
                </td>

                {/* Gap */}
                <td className="f1-text text-xs text-gray-200 font-mono px-2 py-2 w-[80px] overflow-hidden align-middle" style={{ height: '10%' }}>
                  <div className="truncate">{driver.gap}</div>
                </td>

                {/* Interval */}
                <td className="f1-text text-xs text-gray-300 font-mono px-2 py-2 w-[80px] overflow-hidden align-middle" style={{ height: '10%' }}>
                  <div className="truncate">{driver.interval}</div>
                </td>

                {/* Last Lap */}
                <td className="f1-text text-xs text-white font-mono font-semibold px-2 py-2 w-[100px] overflow-hidden align-middle" style={{ height: '10%' }}>
                  <div className="truncate">{driver.lastLap}</div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
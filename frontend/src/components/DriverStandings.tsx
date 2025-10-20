import { motion } from "motion/react";
import { useRaceStore } from "../store/useRaceStore";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { api } from "../services/api";

export function DriverStandings() {
  const drivers = useRaceStore((state) => state.drivers);
  const setDrivers = useRaceStore((state) => state.setDrivers);
  const updateTelemetry = useRaceStore((state) => state.updateTelemetry);
  const updateFuelData = useRaceStore((state) => state.updateFuelData);
  const [isRaceActive, setIsRaceActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [raceTime, setRaceTime] = useState(0);

  // Connect to WebSocket for live race data
  useEffect(() => {
    const websocket = api.connectWebSocket(
      // onSession callback
      (data) => {
        console.log("📊 Race session data:", data);
        // Initialize drivers from session data and reset race state
        if (data.drivers) {
          const initialDrivers = data.drivers.map(
            (driver: any, index: number) => ({
              position: driver.startPosition || index + 1,
              name: driver.name,
              team: driver.team,
              gap: "LEADER",
              interval: "-",
              lastLap: "-",
              teamColor: getTeamColor(driver.team),
              lapTimes: [],
            })
          );
          setDrivers(initialDrivers);
          setIsRaceActive(false); // Reset race state when session data comes in
        }
      },
      // onTick callback - Update drivers with live leaderboard data
      (data) => {
        if (data.leaderboard) {
          setIsRaceActive(true); // Race is active when ticks are coming in
          setRaceTime(data.raceTime || 0); // Update race clock

          const updatedDrivers = data.leaderboard.map(
            (entry: any, index: number) => ({
              position: index + 1,
              name: entry.name,
              team: getTeamName(entry.name), // Get team from name
              gap: index === 0 ? "LEADER" : `+${entry.gap.toFixed(3)}`,
              interval: index === 0 ? "-" : `+${entry.interval.toFixed(3)}`,
              lastLap:
                entry.lastLapTime > 0 ? formatLapTime(entry.lastLapTime) : "-",
              currentLap: entry.lap,
              teamColor: getTeamColor(getTeamName(entry.name)),
              lapTimes: [],
            })
          );
          setDrivers(updatedDrivers);

          // Update telemetry data for Carlos Sainz
          if (data.carlosTelemetry) {
            console.log("🏎️ Received Carlos telemetry:", data.carlosTelemetry);
            updateTelemetry(data.carlosTelemetry);

            // Update fuel data for the current lap
            updateFuelData(
              data.carlosTelemetry.currentLap,
              data.carlosTelemetry.fuelRemainingL
            );
          }
        }
      },
      // onError callback
      (error) => {
        console.error("WebSocket error:", error);
      }
    );

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [setDrivers]);

  // Helper function to get team color
  const getTeamColor = (team: string): string => {
    const teamColors: Record<string, string> = {
      "Williams Racing": "#37BEDD",
      "Red Bull Racing": "#3671C6",
      Mercedes: "#27F4D2",
      McLaren: "#FF8000",
      Ferrari: "#E8002D",
      "Aston Martin": "#229971",
      Alpine: "#FF87BC",
    };
    return teamColors[team] || "#3671C6";
  };

  // Helper function to get team name from driver name
  const getTeamName = (driverName: string): string => {
    const driverTeams: Record<string, string> = {
      "Carlos Sainz": "Williams Racing",
      "Max Verstappen": "Red Bull Racing",
      "Lewis Hamilton": "Mercedes",
      "Lando Norris": "McLaren",
      "Charles Leclerc": "Ferrari",
      "George Russell": "Mercedes",
      "Fernando Alonso": "Aston Martin",
      "Oscar Piastri": "McLaren",
      "Sergio Perez": "Red Bull Racing",
      "Esteban Ocon": "Alpine",
    };
    return driverTeams[driverName] || "Unknown Team";
  };

  // Helper function to format lap time
  const formatLapTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3);
    return `${mins}:${secs.padStart(6, "0")}`;
  };

  // Helper function to format race time
  const formatRaceTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartRace = async () => {
    setIsLoading(true);
    try {
      await api.controlRace("start");
      setIsRaceActive(true);
      console.log("🏁 Race Started!");
    } catch (error) {
      console.error("Failed to start race:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetRace = async () => {
    setIsLoading(true);
    try {
      await api.controlRace("reset");
      setIsRaceActive(false);
      console.log("🔄 Race Reset!");
    } catch (error) {
      console.error("Failed to reset race:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-3 border-b border-[rgba(225,6,0,0.5)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="f1-text text-white">Live Standings</h2>
            {isRaceActive && (
              <div className="f1-text text-white text-sm">
                ⏱️ {formatRaceTime(raceTime)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleStartRace}
              disabled={isLoading || isRaceActive}
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white f1-text text-xs px-3 py-1 h-7"
            >
              {isRaceActive ? "🏁 Racing" : "Start Race"}
            </Button>
            <Button
              onClick={handleResetRace}
              disabled={isLoading}
              size="sm"
              className="bg-gray-600 hover:bg-gray-700 text-white f1-text text-xs px-3 py-1 h-7"
            >
              Reset
            </Button>
          </div>
        </div>
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
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[130px] overflow-hidden">
                DRIVER
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[50px] overflow-hidden">
                LAP
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[70px] overflow-hidden">
                GAP
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[70px] overflow-hidden">
                INT
              </th>
              <th className="f1-text text-xs text-gray-400 text-left px-2 py-2 w-[100px] overflow-hidden">
                LAST LAP
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody style={{ height: "calc(100% - 40px)" }}>
            {drivers.map((driver, index) => {
              const isCarlosSainz = driver.name === "Carlos Sainz";
              return (
                <motion.tr
                  key={driver.position}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ backgroundColor: "rgba(225, 6, 0, 0.1)" }}
                  className={`transition-colors relative group ${
                    isCarlosSainz ? "sainz-highlight" : ""
                  }`}
                  style={{
                    borderLeft: `3px solid ${driver.teamColor}`,
                    boxShadow: isCarlosSainz
                      ? "0 0 15px rgba(232, 0, 45, 0.6), inset 0 0 15px rgba(232, 0, 45, 0.2)"
                      : "none",
                    backgroundColor: isCarlosSainz
                      ? "rgba(232, 0, 45, 0.08)"
                      : "transparent",
                    border: isCarlosSainz
                      ? "1px solid rgba(232, 0, 45, 0.5)"
                      : "none",
                  }}
                >
                  {/* Position */}
                  <td
                    className="f1-text font-bold text-sm px-2 py-2 w-[50px] overflow-hidden align-middle"
                    style={{
                      color: driver.position === 1 ? "#e10600" : "#ffffff",
                      height: "10%",
                    }}
                  >
                    <div className="truncate">{driver.position}</div>
                  </td>

                  {/* Driver Name */}
                  <td
                    className="px-2 py-2 w-[130px] overflow-hidden align-middle"
                    style={{ height: "10%" }}
                  >
                    <div className="flex items-center gap-1">
                      <div className="truncate f1-text text-white text-xs font-medium">
                        {driver.name}
                      </div>
                      {isCarlosSainz && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E8002D] text-white animate-pulse">
                          YOU
                        </span>
                      )}
                    </div>
                    <div
                      className="truncate text-[10px] uppercase tracking-wide"
                      style={{ color: driver.teamColor }}
                    >
                      {driver.team}
                    </div>
                  </td>

                  {/* Lap */}
                  <td
                    className="f1-text text-xs text-white font-mono px-2 py-2 w-[50px] overflow-hidden align-middle"
                    style={{ height: "10%" }}
                  >
                    <div className="truncate">{driver.currentLap || 1}</div>
                  </td>

                  {/* Gap */}
                  <td
                    className="f1-text text-xs text-gray-200 font-mono px-2 py-2 w-[70px] overflow-hidden align-middle"
                    style={{ height: "10%" }}
                  >
                    <div className="truncate">{driver.gap}</div>
                  </td>

                  {/* Interval */}
                  <td
                    className="f1-text text-xs text-gray-300 font-mono px-2 py-2 w-[70px] overflow-hidden align-middle"
                    style={{ height: "10%" }}
                  >
                    <div className="truncate">{driver.interval}</div>
                  </td>

                  {/* Last Lap */}
                  <td
                    className="f1-text text-xs text-white font-mono font-semibold px-2 py-2 w-[100px] overflow-hidden align-middle"
                    style={{ height: "10%" }}
                  >
                    <div className="truncate">{driver.lastLap}</div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

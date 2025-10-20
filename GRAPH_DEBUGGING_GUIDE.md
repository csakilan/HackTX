# Telemetry Graphs - Debugging & Verification Guide

## Added Debug Logging

To help diagnose any issues with the telemetry graphs, I've added comprehensive console logging throughout the data flow:

### 1. Store Update Functions (`useRaceStore.ts`)

**`updateTelemetry()`**

```typescript
console.log(
  "🔧 updateTelemetry called:",
  telemetry.currentLap,
  "lap",
  telemetry.trackMeters,
  "m"
);
console.log("📈 Telemetry data points:", newTelemetryData.length);
```

**`updateFuelData()`**

```typescript
console.log("⛽ updateFuelData called: Lap", lap, "Fuel:", fuel, "L");
console.log("📊 Fuel data points:", newFuelData.length);
```

### 2. WebSocket Data Reception (`DriverStandings.tsx`)

```typescript
console.log("🏎️ Received Carlos telemetry:", data.carlosTelemetry);
```

### 3. Graph Component Updates

**`FuelConsumption.tsx`**

```typescript
console.log("📊 Fuel Data Updated:", fuelData.length, "points");
```

**`ThrottleBrake.tsx`**

```typescript
console.log("📊 Telemetry Data Updated:", telemetryData.length, "points");
```

## How to Test & Verify

### Step 1: Open Browser Console

1. Open your browser's Developer Tools (F12 or Cmd+Option+I)
2. Navigate to the Console tab
3. Filter for emojis or keywords: `telemetry`, `fuel`, `Carlos`

### Step 2: Start the Race

1. Navigate to the F1 Dashboard
2. Click **"Start Race"** button in Driver Standings
3. Watch the console for log messages

### Step 3: Expected Console Output

You should see messages like this every ~33ms (30 Hz):

```
🏎️ Received Carlos telemetry: {name: "Carlos Sainz", team: "Ferrari", speedKph: 285.3, ...}
🔧 updateTelemetry called: 2 lap 1543.7 m
📈 Telemetry data points: 47
⛽ updateFuelData called: Lap 2 Fuel: 17.3 L
📊 Fuel data points: 26
📊 Telemetry Data Updated: 47 points
📊 Fuel Data Updated: 26 points
```

### Step 4: Scroll to Graphs

1. Scroll down to the "Telemetry Data" section
2. All four graphs should now be displaying real-time data

## Troubleshooting

### Issue: No console logs appear

**Possible Causes:**

- Backend not running (run `npm run dev` in `/backend`)
- WebSocket not connected
- Race not started

**Solution:**

1. Check backend is running on `localhost:8787`
2. Open Network tab, filter by WS, verify WebSocket connection
3. Click "Start Race" button

### Issue: Logs appear but graphs don't update

**Possible Causes:**

- Recharts not installed
- Component not re-rendering
- Data format mismatch

**Solution:**

1. Run `npm install recharts` in `/frontend`
2. Check if `fuelData` and `telemetryData` are arrays in console
3. Verify data structure matches graph expectations

### Issue: Graphs show initial data only

**Possible Causes:**

- Zustand not triggering re-renders
- Graph components not subscribed to store changes

**Solution:**

- The components use `useRaceStore((state) => state.telemetryData)` which should auto-subscribe
- Verify Zustand is working by checking other components (e.g., DriverStandings)

## Data Flow Verification

### Complete Data Path:

1. **Backend** (`index.ts` - RaceDO)

   ```
   generateCarlosTelemetry() → TickMessage
   ```

2. **WebSocket**

   ```
   ws.send(JSON.stringify(tickMessage))
   ```

3. **Frontend** (`DriverStandings.tsx`)

   ```
   api.connectWebSocket() → onTick callback
   ```

4. **Store** (`useRaceStore.ts`)

   ```
   updateTelemetry() → set state
   updateFuelData() → set state
   ```

5. **Graph Components**

   ```
   useRaceStore() → auto re-render on state change
   ```

6. **Recharts**
   ```
   <LineChart data={telemetryData}> → render graph
   ```

## Required Dependencies

Verify all dependencies are installed:

```json
{
  "recharts": "^2.15.2", // Charting library
  "zustand": "*", // State management
  "react": "^18.3.1", // React framework
  "lucide-react": "^0.487.0" // Icons
}
```

## Graph Data Structures

### Fuel Consumption Graph

```typescript
fuelData: Array<{
  lap: number; // Lap number (1-70)
  fuel: number; // Fuel remaining in liters (0-110)
}>;
```

### Throttle & Brake Graph

```typescript
telemetryData: Array<{
  distance: number; // Distance in km (0-5.5)
  throttle: number; // Throttle % (0-100)
  brakePressure: number; // Brake % (0-100)
}>;
```

### Tire Temperature Graph

```typescript
telemetryData: Array<{
  distance: number;
  tireTemps: {
    frontLeft: number; // °C (85-110)
    frontRight: number; // °C (85-110)
    rearLeft: number; // °C (85-110)
    rearRight: number; // °C (85-110)
  };
}>;
```

### Brake Temperature Graph

```typescript
telemetryData: Array<{
  distance: number;
  brakeTemps: {
    frontLeft: number; // °C (450-950)
    frontRight: number; // °C (450-950)
    rearLeft: number; // °C (380-800)
    rearRight: number; // °C (380-800)
  };
}>;
```

## Performance Metrics

### Expected Behavior:

- **Update Frequency**: 30 Hz (every ~33ms)
- **Data Points**: Rolling window of 100 points
- **Memory Usage**: Bounded by rolling window
- **FPS**: Smooth 60 FPS rendering

### Monitor Performance:

```javascript
// Check update frequency
let lastUpdate = Date.now();
console.log("Time since last update:", Date.now() - lastUpdate, "ms");
lastUpdate = Date.now();
```

## Quick Fix Checklist

- [ ] Backend running on `localhost:8787`
- [ ] Frontend running on `localhost:3000` or `3001`
- [ ] Race started (click "Start Race" button)
- [ ] Browser console shows telemetry logs
- [ ] WebSocket connected (check Network tab)
- [ ] Recharts installed (`npm list recharts`)
- [ ] No TypeScript errors in components
- [ ] Scroll down to see graphs section
- [ ] Graphs have non-zero height (400px each)

## Common Errors & Solutions

### Error: "Cannot read property 'map' of undefined"

**Cause**: Data array is undefined
**Solution**: Check if `fuelData` or `telemetryData` is initialized in store

### Error: "ResponsiveContainer requires width and height"

**Cause**: Parent div doesn't have explicit dimensions
**Solution**: Verify parent has `className="h-[400px]"`

### Error: Graph shows but no data points

**Cause**: Data array is empty or malformed
**Solution**:

1. Check console for data logs
2. Verify WebSocket is sending `carlosTelemetry`
3. Verify race is started

### Error: Graph stutters/freezes

**Cause**: Too many data points or slow re-renders
**Solution**:

1. Verify rolling window is working (max 100 points)
2. Check if React DevTools shows excessive re-renders
3. Verify `dot={false}` on Line components for performance

## Success Indicators

✅ Console shows continuous telemetry logs (30/sec)
✅ Fuel graph shows decreasing line as laps progress
✅ Throttle/Brake graph shows oscillating patterns
✅ Tire temps hover around 85-110°C
✅ Brake temps spike during braking zones
✅ All graphs update smoothly without stuttering
✅ Data window scrolls as new points are added

## Next Steps

Once graphs are confirmed working:

1. Remove debug console.log statements
2. Add loading states for initial data
3. Add empty state messages
4. Consider adding graph controls (zoom, pan)
5. Add data export functionality
6. Optimize re-render frequency if needed

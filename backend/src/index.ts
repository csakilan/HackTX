// ============================================================================
// Cloudflare Workers Type Declarations
// ============================================================================

declare global {
  interface DurableObjectState {
    id: DurableObjectId;
    storage: DurableObjectStorage;
    blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
    waitUntil(promise: Promise<any>): void;
  }

  interface DurableObjectId {
    toString(): string;
    equals(other: DurableObjectId): boolean;
  }

  interface DurableObjectStorage {
    get<T = unknown>(key: string): Promise<T | undefined>;
    get<T = unknown>(keys: string[]): Promise<Map<string, T>>;
    list<T = unknown>(options?: DurableObjectStorageListOptions): Promise<Map<string, T>>;
    put<T>(key: string, value: T): Promise<void>;
    put<T>(entries: Record<string, T>): Promise<void>;
    delete(key: string): Promise<boolean>;
    delete(keys: string[]): Promise<number>;
    deleteAll(): Promise<void>;
  }

  interface DurableObjectStorageListOptions {
    start?: string;
    end?: string;
    prefix?: string;
    reverse?: boolean;
    limit?: number;
  }

  interface DurableObjectNamespace {
    newUniqueId(): DurableObjectId;
    idFromName(name: string): DurableObjectId;
    idFromString(id: string): DurableObjectId;
    get(id: DurableObjectId): DurableObjectStub;
  }

  interface DurableObjectStub {
    fetch(request: Request): Promise<Response>;
  }

  interface WebSocket {
    accept(): void;
    send(message: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
    addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
    addEventListener(type: "close", listener: (event: CloseEvent) => void): void;
    addEventListener(type: "error", listener: (event: Event) => void): void;
  }

  interface WebSocketPair {
    0: WebSocket;
    1: WebSocket;
  }

  const WebSocketPair: {
    new (): WebSocketPair;
  };

  interface ResponseInit {
    webSocket?: WebSocket;
  }
}

interface Env {
  RACE_DO: DurableObjectNamespace;
  GEMINI_API_KEY: string;
  ELEVENLABS_API_KEY: string;
}

// ============================================================================
// Type Definitions - Exact JSON Schema Match
// ============================================================================

interface SessionMessage {
  type: "session";
  race: {
    raceId: string;
    laps: number;
    lapLengthMeters: number;
    tickHz: number;
  };
  weather: {
    condition: string;
    airTempC: number;
    trackTempC: number;
    humidityPct: number;
    windKph: number;
    windDirDeg: number;
    rain: boolean;
  };
  drivers: DriverConfig[];
  player: {
    name: string;
    team: string;
    telemetryModel: {
      fuelConsumptionRateLPerLap: number;
      brakeTempC: { min: number; max: number };
      tireTempC: { min: number; max: number };
      throttlePct: { min: number; max: number };
      brakePct: { min: number; max: number };
    };
  };
}

interface DriverConfig {
  name: string;
  team: string;
  startPosition: number;
  basePace: number;
  paceJitter: number;
  consistency: number;
  pitLap: number;
}

interface TickMessage {
  type: "tick";
  raceTime: number;
  leaderboard: LeaderboardEntry[];
  carlosTelemetry: CarlosTelemetry;
}

interface LeaderboardEntry {
  name: string;
  lap: number;
  totalTime: number;
  lastLapTime: number; // Time of the last completed lap
  gap: number;
  interval: number;
  trackMeters: number;
  metersBehindLeader: number;
}

interface CarlosTelemetry {
  name: string;
  team: string;
  speedKph: number;
  throttlePct: number;
  brakePct: number;
  brakeTempC: number;
  tireTempC: number;
  fuelRemainingL: number;
  currentLap: number;
  pitLap: number;
  inPit: boolean;
  trackMeters: number;
}

// ============================================================================
// Race Simulation State
// ============================================================================

interface DriverState {
  config: DriverConfig;
  currentLap: number;
  totalTime: number;
  lapStartTime: number;
  lastLapTime: number; // Time of the last completed lap
  lapTimes: number[]; // Array of all completed lap times
  inPit: boolean;
  pitLapsRemaining: number;
  hasPitted: boolean;
  distanceM: number; // Distance into current lap (0 to lapLengthMeters)
}

// ============================================================================
// Durable Object: RaceDO
// ============================================================================

export class RaceDO {
  private state: DurableObjectState;
  private sessions: Set<WebSocket>;
  private intervalId: number | null;
  private raceStartTime: number;
  private raceTime: number;
  private drivers: DriverState[];
  private sessionData: SessionMessage;
  private isRunning: boolean;
  private latestTick: TickMessage | null;
  private previousOrder: string[]; // Track driver names for overtake detection
  private env: Env; // Store env for Gemini API access

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Set();
    this.intervalId = null;
    this.raceStartTime = 0;
    this.raceTime = 0;
    this.drivers = [];
    this.isRunning = false;
    this.latestTick = null;
    this.previousOrder = [];
    this.sessionData = this.createSessionData();
    this.initializeDrivers();
  }

  // Initialize race session data
  private createSessionData(): SessionMessage {
    return {
      type: "session",
      race: {
        raceId: "SIM-TX25",
        laps: 5,
        lapLengthMeters: 3500, // 3.5km track for ~45 second lap times at 280 kph
        tickHz: 20,
      },
      weather: {
        condition: "Dry",
        airTempC: 27.0,
        trackTempC: 39.0,
        humidityPct: 48,
        windKph: 9.5,
        windDirDeg: 210,
        rain: false,
      },
      drivers: [
        { name: "Carlos Sainz", team: "Williams Racing", startPosition: 1, basePace: 85.30, paceJitter: 0.22, consistency: 0.99, pitLap: 3 },
        { name: "Max Verstappen", team: "Red Bull Racing", startPosition: 2, basePace: 84.90, paceJitter: 0.25, consistency: 0.99, pitLap: 3 },
        { name: "Lewis Hamilton", team: "Ferrari", startPosition: 3, basePace: 85.10, paceJitter: 0.27, consistency: 0.98, pitLap: 3 },
        { name: "Lando Norris", team: "McLaren", startPosition: 4, basePace: 85.40, paceJitter: 0.28, consistency: 0.98, pitLap: 3 },
        { name: "Charles Leclerc", team: "Ferrari", startPosition: 5, basePace: 85.25, paceJitter: 0.29, consistency: 0.98, pitLap: 3 },
        { name: "George Russell", team: "Mercedes", startPosition: 6, basePace: 85.50, paceJitter: 0.30, consistency: 0.98, pitLap: 3 },
        { name: "Fernando Alonso", team: "Aston Martin", startPosition: 7, basePace: 85.70, paceJitter: 0.32, consistency: 0.98, pitLap: 3 },
        { name: "Oscar Piastri", team: "McLaren", startPosition: 8, basePace: 85.85, paceJitter: 0.31, consistency: 0.98, pitLap: 3 },
        { name: "Yuki Tsunoda", team: "Red Bull Racing", startPosition: 9, basePace: 85.60, paceJitter: 0.33, consistency: 0.97, pitLap: 3 },
        { name: "Pierre Gasly", team: "Alpine", startPosition: 10, basePace: 86.00, paceJitter: 0.35, consistency: 0.97, pitLap: 3 },
      ],
      player: {
        name: "Carlos Sainz",
        team: "Williams Racing",
        telemetryModel: {
          fuelConsumptionRateLPerLap: 2.35,
          brakeTempC: { min: 450, max: 950 },
          tireTempC: { min: 85, max: 110 },
          throttlePct: { min: 0, max: 100 },
          brakePct: { min: 0, max: 100 },
        },
      },
    };
  }

  // Initialize driver states
  private initializeDrivers(): void {
    this.drivers = this.sessionData.drivers.map((config) => ({
      config,
      currentLap: 1,
      totalTime: 0,
      lapStartTime: 0,
      lastLapTime: 0,
      lapTimes: [],
      inPit: false,
      pitLapsRemaining: 0,
      hasPitted: false,
      distanceM: 0, // Start at the beginning of lap 1
    }));
  }

  // Reset race simulation
  private resetRace(): void {
    // Stop the race first
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Reset all state
    this.raceStartTime = Date.now();
    this.raceTime = 0;
    this.initializeDrivers();
    this.previousOrder = [];
    this.latestTick = null;
    
    // Broadcast reset session data to all clients
    this.broadcast(JSON.stringify(this.sessionData));
  }

  // Start race simulation loop
  private async startRace(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.raceStartTime = Date.now();
    
    // Get Gemini race start commentary
    if (this.env.GEMINI_API_KEY && this.env.GEMINI_API_KEY !== "your-gemini-api-key-here") {
      try {
        const driversInfo = this.drivers.map(d => ({
          name: d.config.name,
          team: d.config.team
        }));
        
        const commentary = await getRaceStartCommentary(driversInfo, {
          apiKey: this.env.GEMINI_API_KEY,
          model: "gemini-pro"
        });
        
        console.log("🤖 GEMINI RACE START COMMENTARY:");
        console.log(commentary);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check for specific Gemini errors and provide debugging info
        if (errorMessage.includes('GEMINI_QUOTA_EXCEEDED')) {
          console.error("💥 GEMINI QUOTA ERROR - Check your API limits!");
          console.error("🔧 DEBUG_CMD: Check Gemini API quota usage");
        } else if (errorMessage.includes('GEMINI_MODEL_NOT_FOUND')) {
          console.error("💥 GEMINI MODEL ERROR - Model not available!");
          console.error("🔧 DEBUG_CMD: Verify model name 'gemini-1.5-pro' is correct");
        } else if (errorMessage.includes('GEMINI_BAD_REQUEST')) {
          console.error("💥 GEMINI REQUEST ERROR - Invalid parameters!");
          console.error("🔧 DEBUG_CMD: Check API request format");
        } else {
          console.error("💥 GEMINI UNKNOWN ERROR:", errorMessage);
          console.error("🔧 DEBUG_CMD: Check network connectivity and API key");
        }
        
        console.log("🤖 GEMINI RACE START COMMENTARY:");
        console.log("Fallback: Lights out and away we go!");
      }
    }
    
    // 20Hz = 50ms interval
    this.intervalId = setInterval(() => {
      this.tick();
    }, 50) as unknown as number;
  }

  // Stop race simulation
  private stopRace(): void {
    this.isRunning = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Main simulation tick (called every 50ms)
  private tick(): void {
    this.raceTime = (Date.now() - this.raceStartTime) / 1000;

    // Update each driver's state
    for (const driver of this.drivers) {
      this.updateDriver(driver);
    }

    // Generate and broadcast tick message
    const tickMsg = this.generateTickMessage();
    this.latestTick = tickMsg; // Store for /ask endpoint
    this.broadcast(JSON.stringify(tickMsg));
  }

  // Update individual driver state
  private updateDriver(driver: DriverState): void {
    const { config } = driver;
    const lapTime = this.calculateLapTime(config);
    const lapLenM = this.sessionData.race.lapLengthMeters;

    // Calculate driver-specific speed based on their pace characteristics
    if (driver.inPit) {
      // Pit lane speed - same for everyone
      const speedKph = 80;
      const speedMps = (speedKph * 1000) / 3600;
      const distanceThisTick = speedMps * 0.05;
      driver.distanceM += distanceThisTick;
    } else {
      // Racing speed - varies by driver based on their pace profile
      const baseSpeedKph = 280; // Base racing speed
      
      // Create very subtle speed differences based on basePace
      // Max Verstappen (84.90) should be only slightly faster than Esteban Ocon (86.00)
      const paceMultiplier = 84.9 / config.basePace; // Very subtle pace differences
      
      // Add minimal random variation per tick - extremely low sensitivity
      const randomVariation = 0.98 + Math.random() * 0.04; // 98% to 102% of base speed
      
      // Add minimal driver-specific characteristics
      const driverTrait = 0.995 + (Math.random() - 0.5) * config.paceJitter * 0.01;
      
      // Calculate final speed for this tick
      const speedKph = baseSpeedKph * paceMultiplier * randomVariation * driverTrait;
      const speedMps = (speedKph * 1000) / 3600;
      const distanceThisTick = speedMps * 0.05; // 50ms tick interval
      
      // Update distance into current lap
      driver.distanceM += distanceThisTick;
    }
    
    // Check if driver should complete current lap
    if (driver.distanceM >= lapLenM && driver.currentLap <= this.sessionData.race.laps) {
      // Calculate actual lap time (time since lap started)
      const actualLapTime = this.raceTime - driver.lapStartTime;
      
      // Lap completed
      driver.distanceM = 0; // Reset to start of new lap
      driver.totalTime += actualLapTime;
      driver.lastLapTime = actualLapTime;
      driver.lapTimes.push(actualLapTime);
      driver.lapStartTime = this.raceTime;
      
      // Check for pit stop
      if (driver.currentLap === config.pitLap && !driver.hasPitted) {
        driver.inPit = true;
        driver.pitLapsRemaining = 1;
        driver.totalTime += 22.0; // Pit stop penalty
        driver.hasPitted = true;
      }
      
      if (driver.pitLapsRemaining > 0) {
        driver.pitLapsRemaining--;
        if (driver.pitLapsRemaining === 0) {
          driver.inPit = false;
        }
      }
      
      driver.currentLap++;
    }
  }

  // Calculate lap time with jitter
  private calculateLapTime(config: DriverConfig): number {
    const jitter = (Math.random() - 0.5) * 2 * config.paceJitter;
    return config.basePace * config.consistency + jitter;
  }

  // Generate tick message with leaderboard and telemetry
  private generateTickMessage(): TickMessage {
    // Sort drivers by actual track position (trackMeters descending - furthest ahead first)
    const lapLenM = this.sessionData.race.lapLengthMeters;
    const sorted = [...this.drivers].sort((a, b) => {
      const aTrackMeters = computeTrackMeters(a.currentLap, a.distanceM, lapLenM);
      const bTrackMeters = computeTrackMeters(b.currentLap, b.distanceM, lapLenM);
      return bTrackMeters - aTrackMeters; // Descending order - furthest ahead first
    });
    
    // Check for overtakes
    const currentOrder = sorted.map(d => d.config.name);
    if (this.previousOrder.length > 0) {
      for (let i = 0; i < Math.min(currentOrder.length, this.previousOrder.length); i++) {
        if (currentOrder[i] !== this.previousOrder[i]) {
          // Overtake detected
          break;
        }
      }
    }
    this.previousOrder = [...currentOrder];
    
    // Calculate average speed for gap/interval time conversion (~280 kph = ~77.78 m/s)
    const avgSpeedMps = (280 * 1000) / 3600; // Average racing speed in meters per second
    
    const leaderboard: LeaderboardEntry[] = sorted.map((driver, idx) => {
      // Calculate track position for this driver and leader
      const trackMeters = computeTrackMeters(driver.currentLap, driver.distanceM, lapLenM);
      const leaderTrackMeters = computeTrackMeters(sorted[0].currentLap, sorted[0].distanceM, lapLenM);
      const metersBehindLeader = idx === 0 ? 0 : Math.max(0, leaderTrackMeters - trackMeters);
      
      // Convert meters behind to time gap (seconds)
      const gap = metersBehindLeader / avgSpeedMps;
      
      // Calculate interval to car ahead
      let interval = 0;
      if (idx > 0) {
        const prevDriverTrackMeters = computeTrackMeters(
          sorted[idx - 1].currentLap, 
          sorted[idx - 1].distanceM, 
          lapLenM
        );
        const metersBehindPrev = Math.max(0, prevDriverTrackMeters - trackMeters);
        interval = metersBehindPrev / avgSpeedMps;
      }
      
      return {
        name: driver.config.name,
        lap: driver.currentLap,
        totalTime: parseFloat(driver.totalTime.toFixed(3)),
        lastLapTime: parseFloat(driver.lastLapTime.toFixed(3)),
        gap: parseFloat(gap.toFixed(3)),
        interval: parseFloat(interval.toFixed(3)),
        trackMeters: trackMeters,
        metersBehindLeader: parseFloat(metersBehindLeader.toFixed(1)),
      };
    });

    // Generate Carlos Sainz telemetry
    const carlos = this.drivers.find(d => d.config.name === "Carlos Sainz")!;
    const carlosTelemetry = this.generateCarlosTelemetry(carlos);

    return {
      type: "tick",
      raceTime: parseFloat(this.raceTime.toFixed(2)),
      leaderboard,
      carlosTelemetry,
    };
  }

  // Generate realistic telemetry for Carlos Sainz
  private generateCarlosTelemetry(carlos: DriverState): CarlosTelemetry {
    const model = this.sessionData.player.telemetryModel;
    const lapProgress = (this.raceTime - carlos.lapStartTime) / this.calculateLapTime(carlos.config);
    
    // Speed varies throughout lap (250-320 kph)
    const speedKph = carlos.inPit ? 80 : 250 + Math.sin(lapProgress * Math.PI * 4) * 35 + Math.random() * 15;
    
    // Throttle and brake anti-correlated
    let throttlePct: number;
    let brakePct: number;
    
    if (carlos.inPit) {
      throttlePct = 20 + Math.random() * 10;
      brakePct = 0;
    } else {
      const braking = Math.sin(lapProgress * Math.PI * 8) < -0.6;
      if (braking) {
        throttlePct = 0;
        brakePct = 60 + Math.random() * 40;
      } else {
        throttlePct = 60 + Math.random() * 40;
        brakePct = 0;
      }
    }
    
    // Brake temp correlates with braking
    const brakeTempC = brakePct > 0 
      ? model.brakeTempC.min + (model.brakeTempC.max - model.brakeTempC.min) * 0.7 + Math.random() * 100
      : model.brakeTempC.min + Math.random() * 100;
    
    // Tire temp
    const tireTempC = model.tireTempC.min + (model.tireTempC.max - model.tireTempC.min) * 0.6 + Math.random() * 10;
    
    // Fuel consumption
    const lapsCompleted = carlos.currentLap - 1;
    const fuelRemainingL = Math.max(0, 20 - lapsCompleted * model.fuelConsumptionRateLPerLap);

    // Calculate Carlos track position
    const lapLenM = this.sessionData.race.lapLengthMeters;
    const trackMeters = computeTrackMeters(carlos.currentLap, carlos.distanceM, lapLenM);

    return {
      name: carlos.config.name,
      team: carlos.config.team,
      speedKph: parseFloat(speedKph.toFixed(1)),
      throttlePct: parseFloat(throttlePct.toFixed(1)),
      brakePct: parseFloat(brakePct.toFixed(1)),
      brakeTempC: parseFloat(brakeTempC.toFixed(1)),
      tireTempC: parseFloat(tireTempC.toFixed(1)),
      fuelRemainingL: parseFloat(fuelRemainingL.toFixed(1)),
      currentLap: carlos.currentLap,
      pitLap: carlos.config.pitLap,
      inPit: carlos.inPit,
      trackMeters: trackMeters,
    };
  }

  // Broadcast message to all connected clients
  private broadcast(message: string): void {
    const toRemove: WebSocket[] = [];
    
    for (const ws of this.sessions) {
      try {
        ws.send(message);
      } catch (err) {
        console.error("❌ Failed to send to client, removing:", err);
        toRemove.push(ws);
      }
    }
    
    // Clean up closed connections
    for (const ws of toRemove) {
      this.sessions.delete(ws);
    }
  }

  // Handle incoming WebSocket connections
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Internal endpoint: get latest tick for /ask
    if (url.pathname === "/internal/latest") {
      return new Response(JSON.stringify(this.latestTick), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Control endpoints
    if (url.pathname === "/control/reset") {
      this.resetRace();
      return new Response("Race reset", { 
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/control/start") {
      this.startRace();
      return new Response("Race started", { 
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/control/stop") {
      this.stopRace();
      return new Response("Race stopped", { 
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // WebSocket upgrade
    if (url.pathname === "/ws") {
      const upgradeHeader = request.headers.get("Upgrade");
      if (upgradeHeader !== "websocket") {
        return new Response("Expected WebSocket", { status: 426 });
      }

      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.handleWebSocket(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response("Not found", { status: 404 });
  }

  // Handle individual WebSocket connection
  private handleWebSocket(ws: WebSocket): void {
    ws.accept();
    
    this.sessions.add(ws);

    // Send session bootstrap message
    ws.send(JSON.stringify(this.sessionData));

    // Don't auto-start race - wait for user to click Start Race button

    ws.addEventListener("close", () => {
      this.sessions.delete(ws);
      
      // Stop race if no clients
      if (this.sessions.size === 0) {
        this.stopRace();
      }
    });

    ws.addEventListener("error", (err) => {
      console.error("❌ WebSocket error:", err);
      this.sessions.delete(ws);
    });
  }
}

// ============================================================================
// Track Distance Helper Functions
// ============================================================================

// Compute absolute track position in meters
function computeTrackMeters(lap: number, distanceM: number, lapLenM: number): number {
  return Math.round((lap - 1) * lapLenM + distanceM);
}

// ============================================================================
// Q&A Helper Functions
// ============================================================================

// Normalize question: lowercase and strip punctuation
function normalizeQuestion(q: string): string {
  return q.toLowerCase().replace(/[.,!?;]/g, "").trim();
}

// Answer question based on telemetry heuristics
function answerQuestion(q: string, tick: TickMessage): string {
  const normalized = normalizeQuestion(q);
  
  if (normalized === "") {
    return "Say again?";
  }

  const telemetry = tick.carlosTelemetry;

  // Battery (fuel) check
  if (normalized.includes("battery ok") || normalized.includes("battery okay")) {
    if (telemetry.fuelRemainingL > 10) {
      return "Battery good. Plenty in hand.";
    } else if (telemetry.fuelRemainingL > 5) {
      return "Battery adequate. Monitor consumption.";
    } else {
      return "Battery low. Conserve energy.";
    }
  }

  // Brakes check
  if (normalized.includes("brakes ok") || normalized.includes("brake ok")) {
    const brakeTemp = telemetry.brakeTempC;
    if (brakeTemp < 550) {
      return "Brakes cool. Good temps.";
    } else if (brakeTemp <= 850) {
      return "Brakes normal. Looking good.";
    } else {
      return "Brakes hot. Manage into turns one and twelve.";
    }
  }

  // Tyres/tires check
  if (normalized.includes("tyres ok") || normalized.includes("tires ok") || 
      normalized.includes("tyre ok") || normalized.includes("tire ok")) {
    const tireTemp = telemetry.tireTempC;
    if (tireTemp < 90) {
      return "Tyres cool. Build temperature.";
    } else if (tireTemp <= 105) {
      return "Tyres good. Continue as planned.";
    } else {
      return "Tyres hot. Manage through slow corners.";
    }
  }

  // Default
  return "Say again?";
}

// ============================================================================
// Worker Entry Point
// ============================================================================

import { askGemini, fallbackAnswer, getRaceStartCommentary, type TelemetryContext } from "./gemini";

interface Env {
  RACE_DO: DurableObjectNamespace;
  GEMINI_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    // Health check endpoint
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), { 
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Content-Type": "application/json"
        }
      });
    }

    // ElevenLabs STT endpoint: POST /stt
    if (url.pathname === "/stt" && request.method === "POST") {
      if (!env.ELEVENLABS_API_KEY || env.ELEVENLABS_API_KEY === "your-elevenlabs-api-key-here") {
        return new Response(JSON.stringify({ error: "ElevenLabs API key not configured" }), {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      }

      try {
        const formData = await request.formData();
        const audioFile = formData.get("file");

        console.log("📥 STT request received, file:", audioFile);

        if (!(audioFile instanceof File)) {
          console.error("❌ No file in request or not a File object");
          return new Response(JSON.stringify({ error: "Missing audio file" }), {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            }
          });
        }

        console.log("📄 File details:", {
          name: audioFile.name,
          type: audioFile.type,
          size: audioFile.size
        });

        // Forward to ElevenLabs Speech-to-Text API
        const elevenLabsForm = new FormData();
        elevenLabsForm.append("file", audioFile, audioFile.name || "audio.webm");
        elevenLabsForm.append("model_id", "scribe_v1"); // ElevenLabs STT model
        elevenLabsForm.append("language", "en"); // Only accept English

        const elevenLabsResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: {
            "xi-api-key": env.ELEVENLABS_API_KEY,
          },
          body: elevenLabsForm,
        });

        if (!elevenLabsResponse.ok) {
          const errorText = await elevenLabsResponse.text();
          console.error("ElevenLabs STT error:", errorText);
          return new Response(JSON.stringify({ error: "Transcription failed", detail: errorText }), {
            status: elevenLabsResponse.status,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            }
          });
        }

        const data = await elevenLabsResponse.json() as { text?: string; transcript?: string };
        const transcribedText = data.text || data.transcript || "";

        return new Response(JSON.stringify({ text: transcribedText }), {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      } catch (error) {
        console.error("STT endpoint error:", error);
        return new Response(JSON.stringify({ error: "STT processing failed" }), {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      }
    }

    // Handle /tts endpoint (Text-to-Speech)
    if (url.pathname === "/tts") {
      try {
        const { text } = await request.json() as { text: string };
        console.log("🔊 TTS request received, text:", text);

        if (!text || text.trim() === "") {
          return new Response(JSON.stringify({ error: "Missing text" }), {
            status: 400,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            }
          });
        }

        // Call ElevenLabs Text-to-Speech API
        // Using a professional male voice suitable for a race engineer
        const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam - deep male voice
        
        const elevenLabsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "xi-api-key": env.ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: text,
              model_id: "eleven_monolingual_v1", // English-only model
              language_code: "en", // Explicitly set English
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          }
        );

        if (!elevenLabsResponse.ok) {
          const errorText = await elevenLabsResponse.text();
          console.error("ElevenLabs TTS error:", errorText);
          return new Response(JSON.stringify({ error: "TTS failed", detail: errorText }), {
            status: elevenLabsResponse.status,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Content-Type": "application/json"
            }
          });
        }

        // Return the audio stream
        return new Response(elevenLabsResponse.body, {
          status: 200,
          headers: {
            "Content-Type": "audio/mpeg",
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (error) {
        console.error("TTS endpoint error:", error);
        return new Response(JSON.stringify({ error: "TTS processing failed" }), {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
          }
        });
      }
    }

    // Get or create the Durable Object instance
    const id = env.RACE_DO.idFromName("global-race");
    const stub = env.RACE_DO.get(id);

    // Handle /ask endpoint
    if (url.pathname === "/ask") {
      const q = url.searchParams.get("q") || "";
      console.log("🎤 DRIVER QUESTION:", q);
      
      // Fetch latest tick from Durable Object
      const doResponse = await stub.fetch(new Request("https://do/internal/latest"));
      const latestTick: TickMessage | null = await doResponse.json();
      
      let answer: string;
      let raceTime: number = 0;
      
      if (latestTick === null) {
        answer = "No telemetry yet.";
      } else {
        raceTime = latestTick.raceTime;
        
        // Build telemetry context for Gemini
        const telemetryContext: TelemetryContext = {
          carlosTelemetry: latestTick.carlosTelemetry,
          leaderboard: latestTick.leaderboard,
          raceTime: latestTick.raceTime,
        };
        
        // Try Gemini API first, fall back to local heuristics if it fails
        if (env.GEMINI_API_KEY && env.GEMINI_API_KEY !== "your-gemini-api-key-here") {
          try {
            answer = await askGemini(q, telemetryContext, {
              apiKey: env.GEMINI_API_KEY,
              model: "gemini-2.5-flash",
            });
            console.log("🤖 AI ENGINEER RESPONSE:", answer);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Specific error debugging for Q&A
            if (errorMessage.includes('GEMINI_QUOTA_EXCEEDED')) {
              console.error("💥 GEMINI Q&A QUOTA ERROR - Using fallback response");
            } else if (errorMessage.includes('GEMINI_MODEL_NOT_FOUND')) {
              console.error("💥 GEMINI Q&A MODEL ERROR - Using fallback response");
            } else {
              console.error("💥 GEMINI Q&A ERROR:", errorMessage, "- Using fallback");
            }
            
            answer = fallbackAnswer(q, telemetryContext);
          }
        } else {
          // No API key configured, use fallback
          answer = fallbackAnswer(q, telemetryContext);
        }
      }
      
      const responseData = {
        question: q,
        answer: answer,
        raceTime: raceTime,
      };
      
      return new Response(JSON.stringify(responseData), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Forward all other requests to the Durable Object
    return stub.fetch(request);
  },
};


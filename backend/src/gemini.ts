// ============================================================================
// Gemini API Integration for F1 Race Engineer
// ============================================================================

export interface GeminiConfig {
  apiKey: string;
  model?: string;
}

export interface TelemetryContext {
  carlosTelemetry: {
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
  };
  leaderboard: Array<{
    name: string;
    lap: number;
    totalTime: number;
    gap: number;
    interval: number;
    trackMeters: number;
    metersBehindLeader: number;
  }>;
  raceTime: number;
}

/**
 * Call Gemini API to answer race engineer questions based on telemetry
 */
export async function askGemini(
  question: string,
  context: TelemetryContext,
  config: GeminiConfig
): Promise<string> {
  const model = config.model || "gemini-pro";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  // Build the system prompt with telemetry context
  const systemPrompt = buildRaceEngineerPrompt(context);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: systemPrompt,
              },
              {
                text: `Driver question: "${question}"`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 150,
          topP: 0.9,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorObj = JSON.parse(errorText);
      
      // Special terminal commands for different error types
      if (response.status === 429) {
        console.error("🚨 GEMINI_QUOTA_EXCEEDED: API quota/rate limit hit");
        throw new Error(`GEMINI_QUOTA_EXCEEDED: ${errorObj.error?.message || errorText}`);
      } else if (response.status === 400) {
        console.error("🚨 GEMINI_BAD_REQUEST: Invalid request parameters");
        throw new Error(`GEMINI_BAD_REQUEST: ${errorObj.error?.message || errorText}`);
      } else if (response.status === 404) {
        console.error("🚨 GEMINI_MODEL_NOT_FOUND: Model not available");
        throw new Error(`GEMINI_MODEL_NOT_FOUND: ${errorObj.error?.message || errorText}`);
      } else {
        console.error(`🚨 GEMINI_API_ERROR_${response.status}:`, errorText);
        throw new Error(`GEMINI_API_ERROR_${response.status}: ${errorObj.error?.message || errorText}`);
      }
    }

    const data = await response.json();

    // Extract the generated text from Gemini's response
    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "Say again?";

    return generatedText.trim();
  } catch (error) {
    console.error("🚨 GEMINI_CONNECTION_FAILED:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`GEMINI_CONNECTION_FAILED: ${errorMessage}`);
  }
}

/**
 * Build a race engineer system prompt with current telemetry data
 */
function buildRaceEngineerPrompt(context: TelemetryContext): string {
  const { carlosTelemetry, leaderboard, raceTime } = context;

  // Find Carlos's position in leaderboard
  const carlosPosition =
    leaderboard.findIndex((entry) => entry.name === carlosTelemetry.name) + 1;
  const carlosLeaderboardEntry = leaderboard.find(
    (entry) => entry.name === carlosTelemetry.name
  );

  return `You are a Formula 1 race engineer for ${carlosTelemetry.team}. 
Your driver is ${carlosTelemetry.name}. You communicate over team radio with short, professional responses.

CURRENT RACE SITUATION (${Math.floor(raceTime)}s elapsed):
- Position: P${carlosPosition}
- Current Lap: ${carlosTelemetry.currentLap}
- Planned Pit Lap: ${carlosTelemetry.pitLap}
- In Pit: ${carlosTelemetry.inPit ? "YES" : "NO"}
${carlosLeaderboardEntry ? `- Gap to Leader: ${carlosLeaderboardEntry.gap.toFixed(1)}s` : ""}

LIVE TELEMETRY:
- Speed: ${carlosTelemetry.speedKph.toFixed(0)} kph
- Throttle: ${carlosTelemetry.throttlePct.toFixed(0)}%
- Brake: ${carlosTelemetry.brakePct.toFixed(0)}%
- Brake Temperature: ${carlosTelemetry.brakeTempC.toFixed(0)}°C (optimal: 300-500°C, critical: >600°C)
- Tire Temperature: ${carlosTelemetry.tireTempC.toFixed(0)}°C (optimal: 90-110°C, critical: >120°C)
- Fuel Remaining: ${carlosTelemetry.fuelRemainingL.toFixed(1)} liters

RESPONSE GUIDELINES:
- Keep responses under 20 words
- Use F1 radio terminology (e.g., "Box box box", "Mode push", "Tires are good")
- Be direct and informative
- Alert driver of critical issues immediately
- If asked about battery/fuel: comment if low (<10L critical, <20L concerning)
- If asked about brakes: comment on temperature (>600°C critical, >550°C high)
- If asked about tires/tyres: comment on temperature (>120°C critical, >110°C warm)
- Stay in character as a professional F1 race engineer

Answer the driver's question based on the telemetry data above:`;
}

/**
 * Fallback local heuristic answer (original logic)
 */
export function fallbackAnswer(question: string, context: TelemetryContext): string {
  const normalized = question.toLowerCase().replace(/[.,!?;]/g, "").trim();

  if (normalized === "") {
    return "Say again?";
  }

  const telemetry = context.carlosTelemetry;

  // Battery (fuel) check
  if (
    normalized.includes("battery ok") ||
    normalized.includes("battery okay")
  ) {
    if (telemetry.fuelRemainingL < 10) {
      return "Battery critical, box this lap!";
    } else if (telemetry.fuelRemainingL < 20) {
      return "Battery low, manage mode.";
    } else {
      return "Battery is good.";
    }
  }

  // Brakes check
  if (normalized.includes("brakes ok") || normalized.includes("brake ok")) {
    if (telemetry.brakeTempC > 600) {
      return "Brakes critical! Manage cooling.";
    } else if (telemetry.brakeTempC > 550) {
      return "Brakes running hot.";
    } else {
      return "Brakes are good.";
    }
  }

  // Tyres/tires check
  if (
    normalized.includes("tyres ok") ||
    normalized.includes("tires ok") ||
    normalized.includes("tyre ok") ||
    normalized.includes("tire ok")
  ) {
    if (telemetry.tireTempC > 120) {
      return "Tyres overheating! Manage pace.";
    } else if (telemetry.tireTempC > 110) {
      return "Tyres running warm.";
    } else {
      return "Tyres are in the window.";
    }
  }

  return "Say again?";
}

/**
 * Generate race start commentary from Gemini
 */
export async function getRaceStartCommentary(
  drivers: Array<{ name: string; team: string }>,
  config: GeminiConfig
): Promise<string> {
  const model = config.model || "gemini-pro";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;

  const prompt = `You are an F1 race commentator. The race is about to start!

STARTING GRID:
${drivers.map((d, i) => `P${i + 1}: ${d.name} (${d.team})`).join("\n")}

Generate an exciting, brief race start commentary (2-3 sentences max) about the race conditions, the grid, and what to watch for. Be enthusiastic and professional like a real F1 commentator.`;

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 100,
          topP: 0.9,
          topK: 40,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorObj = JSON.parse(errorText);
      
      // Special terminal commands for different error types
      if (response.status === 429) {
        console.error("🚨 GEMINI_QUOTA_EXCEEDED: API quota/rate limit hit");
        throw new Error(`GEMINI_QUOTA_EXCEEDED: ${errorObj.error?.message || errorText}`);
      } else if (response.status === 400) {
        console.error("🚨 GEMINI_BAD_REQUEST: Invalid request parameters");
        throw new Error(`GEMINI_BAD_REQUEST: ${errorObj.error?.message || errorText}`);
      } else if (response.status === 404) {
        console.error("🚨 GEMINI_MODEL_NOT_FOUND: Model not available");
        throw new Error(`GEMINI_MODEL_NOT_FOUND: ${errorObj.error?.message || errorText}`);
      } else {
        console.error(`🚨 GEMINI_API_ERROR_${response.status}:`, errorText);
        throw new Error(`GEMINI_API_ERROR_${response.status}: ${errorObj.error?.message || errorText}`);
      }
    }

    const data = await response.json();
    const commentary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "And we're racing!";

    return commentary.trim();
  } catch (error) {
    console.error("🚨 GEMINI_RACE_START_FAILED:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`GEMINI_RACE_START_FAILED: ${errorMessage}`);
  }
}

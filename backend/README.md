# F1 Race Simulation - Cloudflare Workers

Real-time F1 race simulation using Cloudflare Workers, Durable Objects, and WebSockets.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start backend server
npx wrangler dev

# In another terminal, start frontend
cd public
python3 -m http.server 3000
```

Open http://localhost:3000 to view the race simulation.

## 📁 Project Structure

```
hacktxcloudflare/
├── src/
│   └── index.ts          # Main Worker + Durable Object logic
├── public/
│   └── index.html        # Race visualization frontend
├── wrangler.toml         # Cloudflare Worker configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## 🌐 API Endpoints

- `GET /health` - Health check
- `GET /ws` - WebSocket connection for race updates
- `GET /ask?q=...` - Ask race engineer questions
- `POST /control/start` - Start the race
- `POST /control/stop` - Stop the race
- `POST /control/reset` - Reset the race

## 🏎️ Features

- **20Hz WebSocket Updates** - Real-time race telemetry
- **Realistic Overtakes** - Based on driver pace and consistency
- **Distance Tracking** - Track position in meters
- **Pit Stops** - Automated pit stop simulation
- **Q&A System** - Ask your race engineer questions

## 🚢 Deploy to Cloudflare

```bash
# Login to Cloudflare
npx wrangler login

# Deploy
npx wrangler deploy
```

Your Worker will be live at: `https://hacktxcloudflare.YOUR-SUBDOMAIN.workers.dev`

## 📊 WebSocket Messages

### Session (sent once on connect)
```json
{
  "type": "session",
  "race": { "laps": 44, "lapLengthMeters": 5281 },
  "drivers": [...],
  "playerDriver": "Carlos Sainz"
}
```

### Tick (sent every 50ms)
```json
{
  "type": "tick",
  "raceTime": 123.45,
  "leaderboard": [
    {
      "name": "Max Verstappen",
      "currentLap": 5,
      "trackMeters": 12345.6,
      "metersBehindLeader": 0.0
    }
  ],
  "carlosTelemetry": {
    "speedKph": 287,
    "throttlePercent": 98,
    "trackMeters": 12340.1
  }
}
```

## 🔧 Tech Stack

- **Cloudflare Workers** - Serverless compute
- **Durable Objects** - Stateful WebSocket handling
- **TypeScript** - Type-safe development
- **WebSockets** - Real-time bidirectional communication

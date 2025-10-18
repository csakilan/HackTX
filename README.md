# ElevenLabs Speech-to-Text & Text-to-Speech Demo

A React application demonstrating ElevenLabs' Speech-to-Text (Scribe v1) and Text-to-Speech capabilities.

## Features

- **Speech-to-Text**: Record 3 seconds of audio and get instant transcription
- **Text-to-Speech**: Convert text to natural-sounding speech using ElevenLabs voices
- Secure API key handling via backend proxy
- Modern React UI with TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- ElevenLabs API key ([Get one here](https://elevenlabs.io/))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/csakilan/HackTX.git
cd HackTX
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the project root with your ElevenLabs API key:
```
ELEVENLABS_API_KEY=your_api_key_here
PORT=8787
```

### Running the Application

Start both the backend server and frontend dev server:

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8787

## Usage

### Speech-to-Text
1. Click the **"Record (3s)"** button
2. Grant microphone permissions when prompted
3. Speak for approximately 3 seconds
4. View the transcript that appears below the button

### Text-to-Speech
1. Type or edit the text in the textarea
2. Click the **"Speak"** button
3. Listen to the AI-generated speech

## Project Structure

```
HackTX/
├── src/
│   ├── main.tsx          # React entry point
│   └── ui/
│       └── App.tsx       # Main application component
├── server/
│   └── index.ts          # Express API server
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## API Endpoints

### POST /api/stt
Speech-to-Text endpoint. Accepts audio file upload and returns transcript.

### POST /api/tts
Text-to-Speech endpoint. Accepts JSON with text and returns audio file.

### GET /api/health
Health check endpoint.

## Technologies Used

- **Frontend**: React, TypeScript, Vite
- **Backend**: Express.js, Node.js
- **API**: ElevenLabs (Scribe v1, Multilingual v2)
- **Media**: MediaRecorder API, Web Audio API

## Notes

- Microphone access requires HTTPS in production
- Default voice: Adam (ID: JBFqnCBsd6RMkjVDRZzb)
- Recording duration is fixed at 3 seconds
- Starter plan ($5) is sufficient for demo/hackathon use

## License

ISC


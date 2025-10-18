import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

const API = "https://api.elevenlabs.io/v1";
const XI = process.env.ELEVENLABS_API_KEY!;
if (!XI) console.warn("⚠️  ELEVENLABS_API_KEY missing in .env");

// Text → Speech
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceId = "JBFqnCBsd6RMkjVDRZzb", modelId = "eleven_multilingual_v2", format = "mp3_44100_128" } = req.body ?? {};
    const r = await fetch(`${API}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: { "xi-api-key": XI, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: modelId, output_format: format, voice_settings: { stability: 0.4, similarity_boost: 0.6 } })
    });
    if (!r.ok) return res.status(r.status).send(await r.text());
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("content-type", "audio/mpeg");
    res.send(buf);
  } catch (e:any) {
    res.status(500).json({ error: e.message || "tts_failed" });
  }
});

// Speech → Text (Scribe v1)
app.post("/api/stt", upload.single("file"), async (req, res) => {
  try {
    console.log("🎤 [STT] Received request");
    const model = (req.body?.model as string) || "scribe_v1";
    console.log(`📋 [STT] Model: ${model}`);
    
    if (!req.file) {
      console.log("❌ [STT] No file uploaded");
      return res.status(400).json({ error: "file_missing" });
    }

    console.log(`📁 [STT] File received: ${req.file.originalname}, Type: ${req.file.mimetype}, Size: ${req.file.size} bytes`);

    const out = new FormData();
    out.append("model_id", model);
    out.append("file", new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || "audio/webm" }), req.file.originalname || "clip.webm");
    console.log(`📤 [STT] Sending to ElevenLabs API...`);

    const r = await fetch(`${API}/speech-to-text`, {
      method: "POST",
      headers: { "xi-api-key": XI },
      body: out
    });
    
    console.log(`📥 [STT] ElevenLabs response: ${r.status} ${r.statusText}`);
    const text = await r.text();
    console.log(`📄 [STT] Response body: ${text.substring(0, 200)}`);
    
    res.status(r.status).type(r.headers.get("content-type") || "application/json").send(text);
  } catch (e:any) {
    console.error(`❌ [STT] Error:`, e);
    res.status(500).json({ error: e.message || "stt_failed" });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`🔌 API listening on http://localhost:${PORT}`));


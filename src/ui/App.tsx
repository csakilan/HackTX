import React, { useRef, useState } from "react";

function useRecorder(mime = 'audio/mp4;codecs="mp4a.40.2"') {
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);

  async function start() {
    console.log(`[Recorder] Requesting microphone access...`);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    console.log(`[Recorder] Microphone access granted`);
    
    const m = MediaRecorder.isTypeSupported(mime)
      ? mime
      : (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : '');
    console.log(`[Recorder] Selected mime type: ${m || 'default'}`);
    
    const rec = new MediaRecorder(stream, m ? { mimeType: m } : undefined);
    console.log(`[Recorder] MediaRecorder created with actual mimeType: ${rec.mimeType}`);
    
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      console.log(`[Recorder] Data chunk received: ${e.data.size} bytes`);
      e.data.size && chunksRef.current.push(e.data);
    };
    recRef.current = rec;
    rec.start();
    console.log(`[Recorder] Recording started`);
    setRecording(true);
  }

  async function stop(): Promise<File> {
    return new Promise((resolve) => {
      const rec = recRef.current!;
      rec.onstop = () => {
        console.log(`[Recorder] Recording stopped. Total chunks: ${chunksRef.current.length}`);
        const type = rec.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        console.log(`[Recorder] Blob created: ${blob.size} bytes, type: ${type}`);
        const ext = type.includes("mp4") || type.includes("m4a") ? "mp4" : "webm";
        const file = new File([blob], `clip.${ext}`, { type });
        console.log(`[Recorder] File created: ${file.name}`);
        resolve(file);
        setRecording(false);
      };
      console.log(`[Recorder] Stopping recording...`);
      rec.stop();
      rec.stream.getTracks().forEach(t => t.stop());
    });
  }

  return { start, stop, recording };
}

export default function App() {
  const [transcript, setTranscript] = useState<string>("");
  const [ttsText, setTtsText] = useState<string>("Brake earlier at turn five.");
  const [busy, setBusy] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { start, stop, recording } = useRecorder();

  function addDebug(msg: string) {
    console.log(`[DEBUG] ${msg}`);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  }

  async function handleRecord() {
    if (!recording) {
      addDebug("🎤 Starting recording...");
      try {
        await start();
        addDebug("✅ Recording started successfully");
        setTimeout(async () => {
          addDebug("⏱️ 3 seconds elapsed, stopping recording...");
          const f = await stop();
          addDebug(`📁 File created: ${f.name}, Type: ${f.type}, Size: ${f.size} bytes`);
          await uploadForSTT(f);
        }, 3000);
      } catch (e: any) {
        addDebug(`❌ Recording error: ${e.message}`);
      }
    }
  }

  async function uploadForSTT(file: File) {
    setBusy(true);
    addDebug(`📤 Uploading file to /api/stt...`);
    try {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("model", "scribe_v1");
      addDebug(`📦 FormData prepared with file and model`);
      
      const r = await fetch("/api/stt", { method: "POST", body: fd });
      addDebug(`📥 Response received: Status ${r.status} ${r.statusText}`);
      
      const contentType = r.headers.get("content-type");
      addDebug(`📋 Response content-type: ${contentType}`);
      
      const text = await r.text();
      addDebug(`📄 Raw response: ${text.substring(0, 200)}`);
      
      const j = JSON.parse(text);
      const transcriptText = j.text ?? "(no text)";
      setTranscript(transcriptText);
      addDebug(`✅ Transcript received: "${transcriptText}"`);
    } catch (e: any) {
      addDebug(`❌ Upload/Parse error: ${e.message}`);
      setTranscript(`Error: ${e.message}`);
    }
    setBusy(false);
  }

  async function playTTS() {
    setBusy(true);
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        text: ttsText,
        voiceId: "JBFqnCBsd6RMkjVDRZzb",
        modelId: "eleven_multilingual_v2",
        format: "mp3_44100_128"
      })
    });
    if (!r.ok) { alert("TTS error"); setBusy(false); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); setBusy(false); };
    audio.play();
  }

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui", padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <h1>ElevenLabs: Speech ↔ Text (React)</h1>
      <p>Press <b>Record</b> to capture ~3s, send to <i>Scribe v1</i>, and display the transcript. Type text and press <b>Speak</b> to hear TTS.</p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2>🎙️ Speech → Text</h2>
        <button onClick={handleRecord} disabled={busy || recording} style={{ padding: "8px 16px" }}>
          {recording ? "Recording…" : "Record (3s)"}
        </button>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Transcript</div>
          <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, minHeight: 48 }}>{transcript}</div>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #eee", borderRadius: 12 }}>
        <h2>🔊 Text → Speech</h2>
        <textarea
          value={ttsText}
          onChange={(e) => setTtsText(e.target.value)}
          rows={3}
          style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #ddd" }}
        />
        <div style={{ marginTop: 12 }}>
          <button onClick={playTTS} disabled={busy} style={{ padding: "8px 16px" }}>Speak</button>
        </div>
      </section>

      <section style={{ marginTop: 24, padding: 16, border: "2px solid #ff6b6b", borderRadius: 12, background: "#fff5f5" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>🐛 Debug Log</h2>
          <button onClick={() => setDebugInfo([])} style={{ padding: "4px 12px", fontSize: 12 }}>Clear</button>
        </div>
        <div style={{ marginTop: 12, padding: 12, background: "#000", color: "#0f0", borderRadius: 8, minHeight: 100, maxHeight: 300, overflow: "auto", fontFamily: "monospace", fontSize: 12 }}>
          {debugInfo.length === 0 ? (
            <div style={{ color: "#666" }}>No debug messages yet. Click "Record (3s)" to start debugging.</div>
          ) : (
            debugInfo.map((msg, i) => <div key={i} style={{ marginBottom: 4 }}>{msg}</div>)
          )}
        </div>
      </section>
    </div>
  );
}


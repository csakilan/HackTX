// Speech-to-Text service using ElevenLabs via backend

const BACKEND_URL = "http://localhost:8787";

/**
 * Send audio to backend for Speech-to-Text transcription
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");

  const response = await fetch(`${BACKEND_URL}/stt`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`STT failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.text || "";
}

/**
 * Send text to backend for Text-to-Speech conversion and play it
 */
export async function textToSpeech(text: string): Promise<void> {
  try {
    const response = await fetch(`${BACKEND_URL}/tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS failed: ${response.statusText}`);
    }

    // Get the audio blob from the response
    const audioBlob = await response.blob();
    
    // Create a URL for the audio blob
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Create an audio element and play it
    const audio = new Audio(audioUrl);
    
    // Clean up the URL after playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
    
    // Play the audio
    await audio.play();
    console.log("🔊 Playing TTS audio");
  } catch (error) {
    console.error("TTS error:", error);
    throw error;
  }
}

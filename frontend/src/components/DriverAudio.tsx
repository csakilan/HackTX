import { motion } from "motion/react";
import { useRaceStore } from "../store/useRaceStore";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { Radio, Mic, MicOff } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import { transcribeAudio, textToSpeech } from "../services/speech";
import { api } from "../services/api";

export function DriverAudio() {
  const { waveformData, updateWaveform, addMessage } = useRaceStore();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isKeyDownRef = useRef(false);

  useEffect(() => {
    // Only update waveform when speaking
    if (!isSpeaking) return;

    const interval = setInterval(() => {
      updateWaveform();
    }, 100);

    return () => clearInterval(interval);
  }, [updateWaveform, isSpeaking]);

  // Keyboard shortcut: Hold 'T' to speak
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if 'T' key is pressed and not already speaking and not processing
      if (
        e.key.toLowerCase() === "t" &&
        !isKeyDownRef.current &&
        !isProcessing
      ) {
        // Prevent triggering if user is typing in an input field
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }

        isKeyDownRef.current = true;
        setIsSpeaking(true);
        console.log("⌨️ 'T' key pressed - Recording started");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Stop speaking when 'T' key is released
      if (e.key.toLowerCase() === "t" && isKeyDownRef.current) {
        isKeyDownRef.current = false;
        setIsSpeaking(false);
        console.log("⌨️ 'T' key released - Recording stopped");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isProcessing]);

  // Handle microphone recording
  useEffect(() => {
    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        streamRef.current = stream;

        // Try to use audio/webm;codecs=opus, fallback to whatever is supported
        let mimeType = "audio/webm;codecs=opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/webm";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = ""; // Use browser default
          }
        }

        const mediaRecorder = new MediaRecorder(
          stream,
          mimeType ? { mimeType } : undefined
        );
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          // Create audio blob from chunks
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || "audio/webm",
          });

          console.log(
            "🎤 Audio recorded:",
            audioBlob.size,
            "bytes, type:",
            audioBlob.type
          );

          // Check if we have audio data
          if (audioBlob.size === 0) {
            console.error("❌ No audio data recorded");
            return;
          }

          // Transcribe the audio
          setIsProcessing(true);
          try {
            const transcript = await transcribeAudio(audioBlob);
            console.log("🎤 DRIVER TRANSCRIPT:", transcript);

            if (transcript.trim()) {
              // Add driver message to the radio feed
              addMessage({
                sender: "driver",
                text: transcript,
              });

              // Get AI response from Gemini
              try {
                const aiResponse = await api.askQuestion(transcript);

                // Add AI response to the radio feed
                addMessage({
                  sender: "ai",
                  text: aiResponse.answer,
                  confidence: Math.floor(Math.random() * 20) + 80, // Random confidence 80-100%
                });

                // Play the AI response through TTS
                try {
                  await textToSpeech(aiResponse.answer);
                } catch (ttsError) {
                  console.error("TTS playback failed:", ttsError);
                  // Continue even if TTS fails - the text is already shown
                }
              } catch (error) {
                console.error("Failed to get AI response:", error);
                // Add fallback AI message
                const fallbackMessage = "Copy that. Analyzing your feedback...";
                addMessage({
                  sender: "ai",
                  text: fallbackMessage,
                  confidence: 75,
                });

                // Play fallback message through TTS
                try {
                  await textToSpeech(fallbackMessage);
                } catch (ttsError) {
                  console.error("TTS playback failed:", ttsError);
                }
              }
            }
          } catch (error) {
            console.error("Failed to transcribe:", error);
          } finally {
            setIsProcessing(false);
          }

          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        };

        mediaRecorder.start(100); // Collect data every 100ms
        console.log("🎙️ Recording started...");
      } catch (error) {
        console.error("Microphone access error:", error);
        setIsSpeaking(false);
      }
    }

    function stopRecording() {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        console.log("🛑 Recording stopped, processing...");
      }
    }

    if (isSpeaking) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isSpeaking]);

  const chartData = waveformData.map((value, index) => ({
    index,
    value: isSpeaking ? value : 10, // Flat line when not speaking
  }));

  const toggleSpeak = () => {
    if (!isProcessing) {
      setIsSpeaking(!isSpeaking);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(0,146,255,0.3)] overflow-hidden glow-blue">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0090ff] to-[#006bb3] px-4 py-2.5 border-b border-[rgba(0,146,255,0.5)] flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="f1-text text-white flex items-center gap-2 text-sm">
            <Radio className="w-4 h-4" />
            Driver Audio (Live)
          </h3>
          <Button
            onClick={toggleSpeak}
            disabled={isProcessing}
            size="sm"
            className={`f1-text text-xs px-3 py-1 h-7 flex items-center gap-1.5 ${
              isProcessing
                ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                : isSpeaking
                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                : "bg-gray-600 hover:bg-gray-700 text-white"
            }`}
          >
            {isProcessing ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : isSpeaking ? (
              <>
                <Mic className="w-3 h-3" />
                Speaking
              </>
            ) : (
              <>
                <MicOff className="w-3 h-3" />
                Speak
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col gap-3 overflow-hidden">
        {/* Waveform Visualization */}
        <div className="flex-[2] min-h-0 bg-[rgba(0,0,0,0.4)] rounded-lg border border-[rgba(0,146,255,0.2)] overflow-hidden relative">
          {/* Grid lines for effect */}
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-[#0090ff]"
                style={{ top: `${i * 10}%` }}
              />
            ))}
          </div>

          {/* Waveform */}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id="waveformGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#0090ff" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#0090ff" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0090ff"
                strokeWidth={2}
                fill="url(#waveformGradient)"
                animationDuration={100}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Live indicator - only active when speaking */}
          {isSpeaking && (
            <motion.div
              className="absolute top-2 right-2 flex items-center gap-2 bg-[rgba(0,0,0,0.8)] px-2 py-1 rounded-full border border-red-500"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="f1-text text-[10px] text-red-500">
                RECORDING
              </span>
            </motion.div>
          )}
        </div>

        {/* Mini Transcript Preview */}
        <div className="flex-1 min-h-0 bg-[rgba(0,0,0,0.4)] border border-[rgba(0,146,255,0.2)] rounded-lg p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-[#0090ff]" />
            <span className="f1-text text-xs text-gray-400">
              Last Transmission
            </span>
          </div>
          <p className="text-xs text-white mb-1 flex-1 overflow-y-auto">
            "Copy that. How are we looking on strategy?"
          </p>
          <p className="text-[10px] text-gray-500 f1-text flex-shrink-0">
            14:34:22
          </p>
        </div>
      </div>
    </div>
  );
}

import { motion } from 'motion/react';
import { useRaceStore } from '../store/useRaceStore';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { transcribeAudio, textToSpeech } from '../services/speech';
import { api } from '../services/api';

export function EngineerPanel() {
  const { addMessage } = useRaceStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isOverrideRecording, setIsOverrideRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isOverrideModeRef = useRef(false);

  // Calculate delay based on severity
  const calculateDelayFromSeverity = (severity: 'high' | 'medium' | 'low'): number => {
    switch(severity) {
      case 'high':
        return 0; // Immediate
      case 'medium':
        return 3000; // 3 seconds
      case 'low':
        return 5000 + Math.random() * 1000; // 5-6 seconds
      default:
        return 3000;
    }
  };

  // Handle recording (works for both regular and override)
  useEffect(() => {
    const isActivelyRecording = isRecording || isOverrideRecording;
    
    async function startRecording() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        let mimeType = "audio/webm;codecs=opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/webm";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "";
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
          const audioBlob = new Blob(audioChunksRef.current, {
            type: mimeType || "audio/webm",
          });

          if (audioBlob.size === 0) {
            console.error("❌ No audio data recorded");
            return;
          }

          setIsProcessing(true);
          try {
            const transcript = await transcribeAudio(audioBlob);
            console.log("🎙️ ENGINEER TRANSCRIPT (raw):", transcript);

            if (transcript.trim()) {
              // Step 1: Refine the message (remove filler, fix errors)
              console.log("✨ Refining message...");
              let refinedMessage = transcript;
              
              try {
                const refinement = await api.refineMessage(transcript);
                refinedMessage = refinement.refined;
                console.log("✨ REFINED MESSAGE:", refinedMessage);
              } catch (refineError) {
                console.error("Failed to refine message:", refineError);
                // Continue with original transcript
              }

              setCurrentTranscription(refinedMessage);

              // Check if this was an override message
              if (isOverrideModeRef.current) {
                // OVERRIDE: Send immediately to driver
                console.log("⚠️ OVERRIDE MODE: Sending immediately to driver");
                
                // Add to messages with override flag
                addMessage({
                  sender: 'engineer',
                  text: refinedMessage,
                  severity: 'high',
                  isOverride: true,
                });

                // Play immediately via TTS
                try {
                  await textToSpeech(refinedMessage);
                } catch (ttsError) {
                  console.error("TTS playback failed:", ttsError);
                }
              } else {
                // NORMAL: Classify severity using Gemini
                console.log("📊 Classifying message severity...");
                
                try {
                  const classification = await api.classifySeverity(refinedMessage);
                  const severity = classification.severity;
                  const delay = calculateDelayFromSeverity(severity);
                  
                  console.log(`🏷️ Severity: ${severity.toUpperCase()} | Delay: ${(delay / 1000).toFixed(1)}s`);

                  const now = Date.now();
                  const deliveryTime = now + delay;

                  // Add ONCE with all metadata
                  addMessage({
                    sender: 'engineer',
                    text: refinedMessage,
                    severity: severity,
                    createdAt: now,
                    deliveryTime: deliveryTime,
                  });

                  // Play via TTS after delay
                  setTimeout(async () => {
                    try {
                      await textToSpeech(refinedMessage);
                    } catch (ttsError) {
                      console.error("TTS playback failed:", ttsError);
                    }
                  }, delay);
                } catch (classifyError) {
                  console.error("Failed to classify severity:", classifyError);
                  
                  // Fallback to medium severity
                  const severity = 'medium';
                  const delay = calculateDelayFromSeverity(severity);
                  
                  const now = Date.now();
                  const deliveryTime = now + delay;
                  
                  addMessage({
                    sender: 'engineer',
                    text: refinedMessage,
                    severity: severity,
                    createdAt: now,
                    deliveryTime: deliveryTime,
                  });

                  setTimeout(async () => {
                    try {
                      await textToSpeech(refinedMessage);
                    } catch (ttsError) {
                      console.error("TTS playback failed:", ttsError);
                    }
                  }, delay);
                }
              }
            }
          } catch (error) {
            console.error("Failed to transcribe engineer audio:", error);
          } finally {
            setIsProcessing(false);
            setCurrentTranscription('');
          }

          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
        };

        mediaRecorder.start(100);
        console.log("🎙️ Engineer recording started...");
      } catch (error) {
        console.error("Microphone access error:", error);
        setIsRecording(false);
        setIsOverrideRecording(false);
      }
    }

    function stopRecording() {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        console.log("🛑 Engineer recording stopped");
      }
    }

    if (isActivelyRecording) {
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
  }, [isRecording, isOverrideRecording, addMessage]);

  const handleRegularMouseDown = () => {
    isOverrideModeRef.current = false;
    setIsRecording(true);
  };

  const handleRegularMouseUp = () => {
    setIsRecording(false);
  };

  const handleOverrideMouseDown = () => {
    isOverrideModeRef.current = true;
    setIsOverrideRecording(true);
  };

  const handleOverrideMouseUp = () => {
    setIsOverrideRecording(false);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-lg border border-[rgba(225,6,0,0.3)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#e10600] to-[#b00500] px-4 py-2.5 border-b border-[rgba(225,6,0,0.5)] glow-red flex-shrink-0">
        <h3 className="f1-text text-white text-sm">Engineer Control</h3>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col items-center justify-start gap-3 overflow-hidden">
        {/* Buttons Row - Override and Push to Talk */}
        <div className="flex items-center justify-center gap-4 flex-shrink-0">
          {/* Override Button */}
          <motion.button
            onMouseDown={handleOverrideMouseDown}
            onMouseUp={handleOverrideMouseUp}
            onMouseLeave={handleOverrideMouseUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 flex-shrink-0 ${
              isOverrideRecording
                ? 'border-[#ff9500] bg-gradient-to-br from-[#ff9500] to-[#ff6b00] shadow-[0_0_15px_rgba(255,149,0,0.6),0_0_30px_rgba(255,149,0,0.3)] animate-pulse'
                : 'border-[rgba(255,149,0,0.5)] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] hover:border-[#ff9500]'
            }`}
          >
            {/* Pulse ring animation when active */}
            {isOverrideRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[#ff9500]"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <AlertTriangle className={`w-10 h-10 mb-1 ${isOverrideRecording ? 'text-white' : 'text-gray-400'}`} />
              <span className={`f1-text text-[10px] font-bold ${isOverrideRecording ? 'text-white' : 'text-gray-400'}`}>
                OVERRIDE
              </span>
            </div>
          </motion.button>

          {/* Transcribe Button */}
          <motion.button
            onMouseDown={handleRegularMouseDown}
            onMouseUp={handleRegularMouseUp}
            onMouseLeave={handleRegularMouseUp}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-24 h-24 rounded-full border-4 transition-all duration-300 flex-shrink-0 ${
              isRecording
                ? 'border-[#e10600] bg-gradient-to-br from-[#e10600] to-[#b00500] glow-red-strong animate-pulse'
                : 'border-[rgba(225,6,0,0.5)] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] hover:border-[#e10600]'
            }`}
          >
            {/* Pulse ring animation when active */}
            {isRecording && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-[#e10600]"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}

            {/* Icon */}
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              {isRecording ? (
                <Mic className="w-10 h-10 text-white" />
              ) : (
                <MicOff className="w-10 h-10 text-gray-400" />
              )}
            </div>
          </motion.button>
        </div>

        {/* Label */}
        <div className="text-center flex-shrink-0">
          <p className="f1-text text-white text-sm mb-0.5">
            {isRecording || isOverrideRecording ? 'Recording...' : 'Push to Talk'}
          </p>
          <p className="text-[10px] text-gray-500">
            {isOverrideRecording ? 'Override: Immediate delivery' : 'Hold button to transmit'}
          </p>
        </div>

        {/* Live Transcription Box */}
        <div className="w-full flex-1 min-h-0 bg-[rgba(0,0,0,0.4)] border border-[rgba(225,6,0,0.3)] rounded-lg p-3 flex flex-col">
          <div className="flex items-center gap-2 mb-2 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${isRecording || isOverrideRecording ? 'bg-[#e10600] animate-pulse' : 'bg-gray-600'}`} />
            <span className="f1-text text-xs text-gray-400">Live Transcription</span>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: currentTranscription ? 1 : 0.5 }}
            className="text-sm text-white flex-1 overflow-y-auto"
          >
            {currentTranscription || 'Press and hold button to start...'}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function BackendTest() {
  const [healthStatus, setHealthStatus] = useState<string>("Checking...");
  const [questionAnswer, setQuestionAnswer] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);

  // Test health check on mount
  useEffect(() => {
    testHealthCheck();
  }, []);

  const testHealthCheck = async () => {
    try {
      const result = await api.healthCheck();
      setHealthStatus(`✅ Backend is healthy: ${result}`);
      setIsConnected(true);
    } catch (error) {
      setHealthStatus(`❌ Backend connection failed: ${error}`);
      setIsConnected(false);
    }
  };

  const testAskQuestion = async () => {
    try {
      const result = await api.askQuestion("battery ok");
      setQuestionAnswer(
        `Q: "${result.question}" → A: "${result.answer}" (Race time: ${result.raceTime}s)`
      );
    } catch (error) {
      setQuestionAnswer(`❌ Error: ${error}`);
    }
  };

  const testStartRace = async () => {
    try {
      const result = await api.controlRace("start");
      alert(`Race control: ${result}`);
    } catch (error) {
      alert(`❌ Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "monospace" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>
        🔧 Backend Connection Test
      </h1>

      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          background: isConnected ? "#d4edda" : "#f8d7da",
          borderRadius: "8px",
        }}
      >
        <h2>Health Check</h2>
        <p>{healthStatus}</p>
        <button
          onClick={testHealthCheck}
          style={{ marginTop: "10px", padding: "8px 16px", cursor: "pointer" }}
        >
          Retest Health Check
        </button>
      </div>

      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          background: "#e7f3ff",
          borderRadius: "8px",
        }}
      >
        <h2>Test Q&A Endpoint</h2>
        <button
          onClick={testAskQuestion}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Ask: "Battery OK?"
        </button>
        {questionAnswer && (
          <p style={{ marginTop: "10px" }}>{questionAnswer}</p>
        )}
      </div>

      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          background: "#fff3cd",
          borderRadius: "8px",
        }}
      >
        <h2>Test Race Control</h2>
        <button
          onClick={testStartRace}
          style={{ padding: "8px 16px", cursor: "pointer" }}
        >
          Start Race
        </button>
      </div>

      <div
        style={{ padding: "20px", background: "#f8f9fa", borderRadius: "8px" }}
      >
        <h3>
          Backend URL: <code>http://localhost:8787</code>
        </h3>
        <p>
          Make sure the backend is running with: <code>npm run dev</code> in the
          backend folder
        </p>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import Worker from "./worker/worker.ts?worker";

// Create worker ONCE
const worker = new Worker();

// Reuse audio element
const audio = new Audio();

type WorkerMessage =
  | {
    type: "result";
    audio: Blob;
  }
  | {
    type: "error";
    error: string;
  }
  | {
    type: "ready";
  };

export default function App() {
  const [text, setText] = useState(
    "As the waves crashed against the shore, they carried tales of distant lands and adventures untold."
  );

  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // init once
    worker.postMessage({
      type: "init",
      voiceId: "en_US-hfc_female-medium",
    });

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const data = event.data;

      if (data.type === "ready") {
        setIsReady(true);
        return;
      }

      if (data.type === "result") {
        setLoading(false);

        const url = URL.createObjectURL(data.audio);

        audio.src = url;

        audio.onended = () => {
          URL.revokeObjectURL(url);
        };

        audio.play();
      }

      if (data.type === "error") {
        setLoading(false);
        console.error(data.error);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  const handleSpeak = () => {
    if (!text.trim()) return;

    setLoading(true);

    worker.postMessage({
      type: "predict",
      text,
      voiceId: "en_US-hfc_female-medium",
    });
  };

  return (
    <div
      style={{
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 600,
      }}
    >
      <h1>React VITS TTS</h1>

      <textarea
        rows={6}
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          padding: 12,
          fontSize: 16,
        }}
      />

      <button
        onClick={handleSpeak}
        disabled={!isReady || loading}
        style={{
          padding: "12px 16px",
          cursor: "pointer",
        }}
      >
        {loading ? "Generating..." : "Speak"}
      </button>

      {!isReady && <p>Loading model...</p>}
    </div>
  );
}
import { useEffect, useRef, useState } from "react";
import TTSWorker from "./worker/worker?worker";

type WorkerMessage =
  | {
    type: "ready";
  }
  | {
    type: "result";
    audio: Blob;
  }
  | {
    type: "error";
    error: string;
  };

export default function App() {
  const workerRef = useRef<Worker | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [text, setText] = useState(
    "As the waves crashed against the shore, they carried tales of distant lands and adventures untold."
  );

  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // create worker instance
    const worker = new TTSWorker();

    workerRef.current = worker;

    // create audio instance
    audioRef.current = new Audio();

    // initialize model
    worker.postMessage({
      type: "init",
      voiceId: "en_US-hfc_female-medium",
    });

    // receive messages
    worker.onmessage = async (
      event: MessageEvent<WorkerMessage>
    ) => {
      const data = event.data;

      switch (data.type) {
        case "ready":
          setIsReady(true);
          break;

        case "result": {
          setLoading(false);

          const url = URL.createObjectURL(data.audio);

          if (audioRef.current) {
            audioRef.current.pause();

            audioRef.current.src = url;

            audioRef.current.onended = () => {
              URL.revokeObjectURL(url);
            };

            try {
              await audioRef.current.play();
            } catch (err) {
              console.error(err);
            }
          }

          break;
        }

        case "error":
          setLoading(false);
          console.error("Worker Error:", data.error);
          break;
      }
    };

    worker.onerror = (err) => {
      console.error("Worker crashed:", err);
      setLoading(false);
    };

    // cleanup
    return () => {
      worker.terminate();

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  const handleSpeak = () => {
    if (!text.trim()) return;

    if (!workerRef.current) return;

    setLoading(true);

    workerRef.current.postMessage({
      type: "predict",
      text,
      voiceId: "en_US-hfc_female-medium",
    });
  };

  return (
    <div
      style={{
        maxWidth: 700,
        margin: "40px auto",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        fontFamily: "sans-serif",
      }}
    >
      <h1>React TTS Worker Example</h1>

      <textarea
        rows={8}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
        style={{
          padding: 16,
          fontSize: 16,
          borderRadius: 8,
          border: "1px solid #ccc",
          resize: "vertical",
        }}
      />

      <button
        onClick={handleSpeak}
        disabled={!isReady || loading}
        style={{
          padding: "14px 18px",
          fontSize: 16,
          borderRadius: 8,
          border: "none",
          cursor: !isReady || loading ? "not-allowed" : "pointer",
          opacity: !isReady || loading ? 0.6 : 1,
        }}
      >
        {loading
          ? "Generating Speech..."
          : isReady
            ? "Speak"
            : "Loading Model..."}
      </button>

      <div>
        <strong>Status:</strong>{" "}
        {loading
          ? "Generating..."
          : isReady
            ? "Ready"
            : "Loading model"}
      </div>
    </div>
  );
}
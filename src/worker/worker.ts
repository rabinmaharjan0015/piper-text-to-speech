/// <reference lib="webworker" />

import * as tts from "@diffusionstudio/vits-web";

type WorkerMessage =
        | {
                type: "init";
        }
        | {
                type: "predict";
                text: string;
                voiceId?: tts.VoiceId;
        };

let initialized = false;

self.addEventListener(
        "message",
        async (event: MessageEvent<WorkerMessage>) => {
                const data = event.data;

                try {
                        // INIT
                        if (data.type === "init") {
                                initialized = true;

                                self.postMessage({
                                        type: "ready",
                                });

                                return;
                        }

                        // PREDICT
                        if (data.type === "predict") {
                                if (!initialized) {
                                        throw new Error("TTS not initialized");
                                }

                                if (!data.text || typeof data.text !== "string") {
                                        throw new Error("Invalid text");
                                }

                                const start = performance.now();

                                const blob = await tts.predict({
                                        text: data.text,
                                        voiceId: data.voiceId || "en_US-hfc_female-medium",
                                });

                                console.log(
                                        "Time taken:",
                                        performance.now() - start,
                                        "ms"
                                );

                                self.postMessage({
                                        type: "result",
                                        audio: blob,
                                });

                                return;
                        }
                } catch (error) {
                        self.postMessage({
                                type: "error",
                                error:
                                        error instanceof Error
                                                ? error.message
                                                : "Unknown error",
                        });
                }
        }
);

export { };
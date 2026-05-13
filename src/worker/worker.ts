/// <reference lib="webworker" />

import * as tts from "@diffusionstudio/vits-web";

let initialized = false;

window.self.addEventListener("message", async (event) => {
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

                // PREDICT / SPEAK
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

                        window.self.postMessage({
                                type: "result",
                                audio: blob,
                        });

                        return;
                }
        } catch (error) {
                window.self.postMessage({
                        type: "error",
                        error:
                                error instanceof Error
                                        ? error.message
                                        : "Unknown error",
                });
        }
});
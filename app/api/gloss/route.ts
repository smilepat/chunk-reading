import { createGlossRoute } from "chunk-reading/server";

// Gemini SDK needs the Node runtime (not edge).
export const runtime = "nodejs";
export const maxDuration = 60;

// The bundled route handler — reads GEMINI_API_KEY from the environment.
export const POST = createGlossRoute();

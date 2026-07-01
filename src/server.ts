// Server entry — the bundled Gemini backend for generating 직독직해 cues. Keep
// this out of client bundles (it imports @google/genai). Use from a Next.js route
// handler or any Node server.
export { glossChunks } from "./server/gloss";
export type { GlossOptions } from "./server/gloss";
export { createGlossRoute } from "./server/route";

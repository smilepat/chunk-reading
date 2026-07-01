// Framework-agnostic core — safe to import from server or client (no React, no
// "use client"): the deterministic chunker + the 직독직해 gloss prompt/aligner.
export { chunkText, chunkSpan, splitSentences, paragraphChunks } from "./chunk";
export { buildGlossPrompt, alignGlosses } from "./gloss";
export type { RawGloss } from "./gloss";
export type { Chunk, GlossFn } from "./types";

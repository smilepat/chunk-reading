"use client";

// Client entry (React) — the drop-in component + browser helpers. This whole
// entry is a client module; import pure/server-safe helpers from
// "chunk-reading/core" instead when you need them in a Server Component.
export { ChunkReading } from "./react/ChunkReading";
export type { ChunkReadingProps } from "./react/ChunkReading";
export {
  useEnglishVoices,
  bestEnglishVoice,
  isEnglishVoice,
} from "./react/useEnglishVoices";
export { createFetchGlossFn } from "./react/glossClient";

// Convenience re-exports of the framework-agnostic core (types are erased; the
// pure functions are safe to use anywhere).
export {
  chunkText,
  chunkSpan,
  splitSentences,
  paragraphChunks,
  buildGlossPrompt,
  alignGlosses,
} from "./core/index";
export type { Chunk, GlossFn, RawGloss } from "./core/index";

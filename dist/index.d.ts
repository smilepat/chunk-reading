import * as react from 'react';
import { CSSProperties } from 'react';

/** A sense-group chunk — an exact slice of the source text (offsets → 0 drop). */
interface Chunk {
    text: string;
    start: number;
    end: number;
}
/**
 * Produces a Korean 직독직해 gloss for each English chunk, in the same order.
 * Inject your own (any AI/cache/backend) or use the bundled fetch client.
 */
type GlossFn = (chunks: string[]) => Promise<string[]>;

interface ChunkReadingProps {
    /** The English passage to practise (plain text; blank lines = paragraphs). */
    text: string;
    /**
     * Custom 직독직해 backend `(chunks) => Promise<koGlosses>`. If omitted, POSTs to
     * `glossEndpoint` (default `/api/gloss` — mount the bundled route there).
     */
    glossFn?: GlossFn;
    /** Endpoint for the default fetch backend (ignored when `glossFn` is given). */
    glossEndpoint?: string;
    /** Initial TTS rate (0.6–1.1). Default 0.85 (slightly slow for EFL). */
    rate?: number;
    /** Speak the English aloud when a chunk is revealed. Default true. */
    speakOnReveal?: boolean;
    /** sessionStorage cache key for the generated cues. Default: hash of `text`. */
    cacheKey?: string;
    /** Extra class/style on the root element. */
    className?: string;
    style?: CSSProperties;
}
/**
 * 🇰🇷 직독직해 (read-in-order) cue practice.
 *
 * Splits a passage into sense-group chunks and shows a short Korean cue for each,
 * with the English laid over faintly. The learner reads the Korean cue, recalls
 * the English, then taps the chunk to reveal it clearly and hear a native voice.
 *
 * Drop-in and self-contained: inline styles (no CSS framework required), bring
 * your own cue backend via `glossFn`, or point `glossEndpoint` at the bundled
 * `/api/gloss` route (see `chunk-reading/server`).
 */
declare function ChunkReading({ text, glossFn, glossEndpoint, rate: initialRate, speakOnReveal, cacheKey, className, style, }: ChunkReadingProps): react.JSX.Element;

/** True for an English voice (en-US / en-GB / …). */
declare function isEnglishVoice(v: SpeechSynthesisVoice | null | undefined): boolean;
/** Best native-English voice available, or null. */
declare function bestEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null;
/**
 * Shared native-English Web Speech state: loads voices (async), defaults to the
 * most native-sounding one, and exposes speak/cancel that NEVER read English with
 * a non-English voice (re-scans at speak time so late-loading voices count).
 */
declare function useEnglishVoices(): {
    ready: boolean;
    voices: SpeechSynthesisVoice[];
    enVoices: SpeechSynthesisVoice[];
    otherVoices: SpeechSynthesisVoice[];
    voiceURI: string;
    select: (uri: string) => void;
    speak: (text: string, rate?: number) => void;
    cancel: () => void;
};

/**
 * Default gloss backend: POST { chunks } to an endpoint that returns { glosses }.
 * Point it at the bundled route (see `chunk-reading/server`) or any compatible
 * endpoint. Pass your own `GlossFn` to the component to bypass this entirely.
 */
declare function createFetchGlossFn(endpoint?: string): GlossFn;

/** Split text[start,end) into sense-group chunks for meaning-unit reading. */
declare function chunkSpan(text: string, start: number, end: number): Chunk[];
/**
 * Split raw text into sentence spans (exact offsets). Heuristic: a sentence ends
 * at a run of . ! ? followed by whitespace/EOF, or at a blank line (paragraph
 * break). Good enough for a reading aid; abbreviations may over-split (rare).
 */
declare function splitSentences(text: string): {
    start: number;
    end: number;
}[];
/**
 * Chunk an entire passage in reading order. Sentences are split deterministically
 * first so chunks never cross a sentence boundary; offsets index into `text`.
 */
declare function chunkText(text: string): Chunk[];
/**
 * Group chunks into paragraphs (by blank lines between them) and attach each
 * chunk's global index (gi) — a rendering aid to keep passages readable.
 */
declare function paragraphChunks(text: string, chunks: Chunk[]): {
    c: Chunk;
    gi: number;
}[][];

interface RawGloss {
    i: number;
    ko: string;
}
/** Build the 직독직해 prompt for an ordered list of English chunks. */
declare function buildGlossPrompt(chunks: string[]): string;
/**
 * Align raw glosses (any order, possibly missing/extra) to a length-`count`
 * array, indexed by chunk position. Out-of-range or malformed entries are
 * dropped; missing indices stay "". Pure & deterministic.
 */
declare function alignGlosses(count: number, raw: RawGloss[]): string[];

export { type Chunk, ChunkReading, type ChunkReadingProps, type GlossFn, type RawGloss, alignGlosses, bestEnglishVoice, buildGlossPrompt, chunkSpan, chunkText, createFetchGlossFn, isEnglishVoice, paragraphChunks, splitSentences, useEnglishVoices };

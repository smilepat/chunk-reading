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

export { type Chunk, type GlossFn, type RawGloss, alignGlosses, buildGlossPrompt, chunkSpan, chunkText, paragraphChunks, splitSentences };

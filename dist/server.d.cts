interface GlossOptions {
    /** Gemini API key. Defaults to `process.env.GEMINI_API_KEY`. */
    apiKey?: string;
    /** Model id. Defaults to `GEMINI_MODEL` env or `gemini-2.5-flash`. */
    model?: string;
    /** Thinking token budget. Defaults to `GEMINI_THINKING_BUDGET` env or 0. */
    thinkingBudget?: number;
}
/**
 * Generate one short Korean 직독직해 cue per chunk, in the same order. Alignment
 * is by index (alignGlosses), so a dropped/reordered item never shifts the rest.
 */
declare function glossChunks(chunks: string[], opts?: GlossOptions): Promise<string[]>;

/**
 * A framework-light POST handler for `{ chunks: string[] } → { glosses: string[] }`.
 * Works as a Next.js App Router route or any Web-Fetch runtime:
 *
 * ```ts
 * // app/api/gloss/route.ts
 * import { createGlossRoute } from "chunk-reading/server";
 * export const runtime = "nodejs";
 * export const POST = createGlossRoute();          // uses process.env.GEMINI_API_KEY
 * ```
 */
declare function createGlossRoute(opts?: GlossOptions): (req: Request) => Promise<Response>;

export { type GlossOptions, createGlossRoute, glossChunks };

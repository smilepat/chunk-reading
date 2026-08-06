interface GlossOptions {
    /** Gemini API key. Defaults to `process.env.GEMINI_API_KEY`. */
    apiKey?: string;
    /** Model id. Defaults to `GEMINI_MODEL` env or `gemini-2.5-flash`. */
    model?: string;
    /** Thinking token budget. Defaults to `GEMINI_THINKING_BUDGET` env or 0. */
    thinkingBudget?: number;
}
/**
 * Generate the full cue set per chunk, in the same order: 직독직해 gloss + 추임새
 * role prompt. Alignment is by index (alignGlosses/alignRoles), so a dropped or
 * reordered item never shifts the rest.
 */
declare function glossChunkCues(chunks: string[], opts?: GlossOptions): Promise<{
    glosses: string[];
    roles: string[];
}>;
/**
 * Legacy shape — glosses only. Kept for API compatibility; internally one call.
 */
declare function glossChunks(chunks: string[], opts?: GlossOptions): Promise<string[]>;

/**
 * A framework-light POST handler for
 * `{ chunks: string[] } → { glosses: string[], roles: string[] }`
 * (roles = 추임새 role prompts; older clients that only read `glosses` keep working).
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

export { type GlossOptions, createGlossRoute, glossChunkCues, glossChunks };

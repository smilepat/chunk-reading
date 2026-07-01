import { glossChunks, type GlossOptions } from "./gloss";

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

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
export function createGlossRoute(opts: GlossOptions = {}) {
  return async function POST(req: Request): Promise<Response> {
    let chunks: unknown;
    try {
      const body = await req.json();
      chunks = (body as { chunks?: unknown }).chunks;
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    if (!Array.isArray(chunks) || chunks.some((c) => typeof c !== "string")) {
      return json({ error: "`chunks` must be an array of strings" }, 400);
    }
    if (chunks.length === 0) return json({ glosses: [] }, 200);
    if (chunks.length > 400) return json({ error: "too many chunks (max 400)" }, 413);
    try {
      const glosses = await glossChunks(chunks as string[], opts);
      return json({ glosses }, 200);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "gloss failed" }, 500);
    }
  };
}

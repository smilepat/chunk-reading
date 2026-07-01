import { buildGlossPrompt, alignGlosses } from './chunk-7ERVY736.js';
import { Type, GoogleGenAI } from '@google/genai';

var DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
function defaultThinkingBudget() {
  return process.env.GEMINI_THINKING_BUDGET ? Number(process.env.GEMINI_THINKING_BUDGET) : 0;
}
var GLOSS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    glosses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          i: { type: Type.INTEGER, description: "chunk index (0-based)" },
          ko: {
            type: Type.STRING,
            description: "short \uC9C1\uB3C5\uC9C1\uD574 Korean for that chunk, in reading order"
          }
        },
        required: ["i", "ko"],
        propertyOrdering: ["i", "ko"]
      }
    }
  },
  required: ["glosses"]
};
async function glossChunks(chunks, opts = {}) {
  var _a, _b;
  if (chunks.length === 0) return [];
  const apiKey = opts.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey"
    );
  }
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model: opts.model || DEFAULT_MODEL,
    contents: buildGlossPrompt(chunks),
    config: {
      responseMimeType: "application/json",
      responseSchema: GLOSS_SCHEMA,
      temperature: 0,
      thinkingConfig: { thinkingBudget: (_a = opts.thinkingBudget) != null ? _a : defaultThinkingBudget() }
    }
  });
  const text = res.text;
  if (!text) throw new Error("Gemini returned no text");
  const parsed = JSON.parse(text);
  return alignGlosses(chunks.length, (_b = parsed.glosses) != null ? _b : []);
}

// src/server/route.ts
function json(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" }
  });
}
function createGlossRoute(opts = {}) {
  return async function POST(req) {
    let chunks;
    try {
      const body = await req.json();
      chunks = body.chunks;
    } catch {
      return json({ error: "invalid JSON body" }, 400);
    }
    if (!Array.isArray(chunks) || chunks.some((c) => typeof c !== "string")) {
      return json({ error: "`chunks` must be an array of strings" }, 400);
    }
    if (chunks.length === 0) return json({ glosses: [] }, 200);
    if (chunks.length > 400) return json({ error: "too many chunks (max 400)" }, 413);
    try {
      const glosses = await glossChunks(chunks, opts);
      return json({ glosses }, 200);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "gloss failed" }, 500);
    }
  };
}

export { createGlossRoute, glossChunks };
//# sourceMappingURL=server.js.map
//# sourceMappingURL=server.js.map
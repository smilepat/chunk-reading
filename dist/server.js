import { buildGlossPrompt, alignRoles, alignGlosses } from './chunk-HGDBTP4K.js';
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
          },
          q: {
            type: Type.STRING,
            description: "\uCD94\uC784\uC0C8 \u2014 very short Korean role prompt for the chunk (\uB204\uAC00/\uBB34\uC5C7\uC744/\uC5B4\uB514\uB85C/\uC65C/\uBB34\uC5C7\uD558\uB7EC/\uC5B4\uB5A4 \uB4F1)"
          }
        },
        required: ["i", "ko", "q"],
        propertyOrdering: ["i", "ko", "q"]
      }
    }
  },
  required: ["glosses"]
};
async function glossChunkCues(chunks, opts = {}) {
  var _a, _b, _c;
  if (chunks.length === 0) return { glosses: [], roles: [] };
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
  return {
    glosses: alignGlosses(chunks.length, (_b = parsed.glosses) != null ? _b : []),
    roles: alignRoles(chunks.length, (_c = parsed.glosses) != null ? _c : [])
  };
}
async function glossChunks(chunks, opts = {}) {
  return (await glossChunkCues(chunks, opts)).glosses;
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
    if (chunks.length === 0) return json({ glosses: [], roles: [] }, 200);
    if (chunks.length > 400) return json({ error: "too many chunks (max 400)" }, 413);
    try {
      const { glosses, roles } = await glossChunkCues(chunks, opts);
      return json({ glosses, roles }, 200);
    } catch (e) {
      return json({ error: e instanceof Error ? e.message : "gloss failed" }, 500);
    }
  };
}

export { createGlossRoute, glossChunkCues, glossChunks };
//# sourceMappingURL=server.js.map
//# sourceMappingURL=server.js.map
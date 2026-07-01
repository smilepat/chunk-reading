'use strict';

var genai = require('@google/genai');

// src/server/gloss.ts

// src/core/gloss.ts
function buildGlossPrompt(chunks) {
  const numbered = chunks.map((c, i) => `${i}	${c}`).join("\n");
  return `You are a Korean English-reading coach teaching \uC9C1\uB3C5\uC9C1\uD574 (reading and understanding in English word order).

You are given a passage already split into sense-group CHUNKS \u2014 one per line as "<index>\\t<English chunk>", in reading order.

For EACH chunk, write a SHORT Korean gloss the learner would say WHILE reading left to right \u2014 translating THAT chunk as a forward-reading unit, NOT rearranged into a full natural-Korean sentence.

Rules:
- Keep the English reading order. Do NOT reorder chunks into natural Korean sentence order.
- Translate each chunk on its own; use neighbouring chunks only to pick the right particle/tense.
- Keep each gloss short and spoken, like a \uC9C1\uB3C5\uC9C1\uD574 cue. Examples:
    "I went" \u2192 "\uB098\uB294 \uAC14\uB2E4"
    "to Pusan" \u2192 "\uBD80\uC0B0\uC73C\uB85C"
    "President Lee went" \u2192 "\uC774 \uB300\uD1B5\uB839\uC740 \uAC14\uB2E4"
    "to Italy" \u2192 "\uC774\uD0C8\uB9AC\uC544\uB85C"
    "because the economy" \u2192 "\uACBD\uC81C\uAC00"
    "was struggling" \u2192 "\uC5B4\uB824\uC6C0\uC744 \uACAA\uACE0 \uC788\uC5C8\uAE30 \uB54C\uBB38\uC5D0"
- Provide a gloss for EVERY index, exactly once.
- Korean only \u2014 no romanization, no English, no extra commentary.

Chunks:
${numbered}

Return JSON: { "glosses": [ { "i": <index>, "ko": "<\uC9C1\uB3C5\uC9C1\uD574>" }, ... ] } covering every index.`;
}
function alignGlosses(count, raw) {
  const out = new Array(count).fill("");
  for (const g of raw) {
    if (g && Number.isInteger(g.i) && g.i >= 0 && g.i < count && typeof g.ko === "string") {
      out[g.i] = g.ko.trim();
    }
  }
  return out;
}

// src/server/gloss.ts
var DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
function defaultThinkingBudget() {
  return process.env.GEMINI_THINKING_BUDGET ? Number(process.env.GEMINI_THINKING_BUDGET) : 0;
}
var GLOSS_SCHEMA = {
  type: genai.Type.OBJECT,
  properties: {
    glosses: {
      type: genai.Type.ARRAY,
      items: {
        type: genai.Type.OBJECT,
        properties: {
          i: { type: genai.Type.INTEGER, description: "chunk index (0-based)" },
          ko: {
            type: genai.Type.STRING,
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
  const ai = new genai.GoogleGenAI({ apiKey });
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

exports.createGlossRoute = createGlossRoute;
exports.glossChunks = glossChunks;
//# sourceMappingURL=server.cjs.map
//# sourceMappingURL=server.cjs.map
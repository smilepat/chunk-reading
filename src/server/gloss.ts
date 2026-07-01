import { GoogleGenAI, Type } from "@google/genai";
import { buildGlossPrompt, alignGlosses, type RawGloss } from "../core/gloss";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Disable Gemini 2.5's dynamic "thinking" — adds ~3x latency for little gain on
// this temperature-0 structured task. Override with GEMINI_THINKING_BUDGET.
function defaultThinkingBudget(): number {
  return process.env.GEMINI_THINKING_BUDGET
    ? Number(process.env.GEMINI_THINKING_BUDGET)
    : 0;
}

const GLOSS_SCHEMA = {
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
            description: "short 직독직해 Korean for that chunk, in reading order",
          },
        },
        required: ["i", "ko"],
        propertyOrdering: ["i", "ko"],
      },
    },
  },
  required: ["glosses"],
};

export interface GlossOptions {
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
export async function glossChunks(
  chunks: string[],
  opts: GlossOptions = {},
): Promise<string[]> {
  if (chunks.length === 0) return [];
  const apiKey = opts.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Get one at https://aistudio.google.com/apikey",
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
      thinkingConfig: { thinkingBudget: opts.thinkingBudget ?? defaultThinkingBudget() },
    },
  });
  const text = res.text;
  if (!text) throw new Error("Gemini returned no text");
  const parsed = JSON.parse(text) as { glosses?: RawGloss[] };
  return alignGlosses(chunks.length, parsed.glosses ?? []);
}

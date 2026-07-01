// 직독직해 (literal, read-in-order translation) cue generator.
//
// Given the passage's sense-group chunks (English, in reading order), an AI
// produces a SHORT Korean gloss for each chunk — translated as a forward-reading
// unit so a Korean learner can map "I went" → "나는 갔다", "to Pusan" → "부산으로".
//
// The AI returns glosses BY INDEX (no offsets, no re-chunking); alignment back to
// the chunk list is positional and validated here (alignGlosses). This keeps the
// "AI labels only / offsets are deterministic" invariant.

export interface RawGloss {
  i: number; // chunk index (0-based, matches the input order)
  ko: string; // 직독직해 Korean for that chunk
}

/** Build the 직독직해 prompt for an ordered list of English chunks. */
export function buildGlossPrompt(chunks: string[]): string {
  const numbered = chunks.map((c, i) => `${i}\t${c}`).join("\n");
  return `You are a Korean English-reading coach teaching 직독직해 (reading and understanding in English word order).

You are given a passage already split into sense-group CHUNKS — one per line as "<index>\\t<English chunk>", in reading order.

For EACH chunk, write a SHORT Korean gloss the learner would say WHILE reading left to right — translating THAT chunk as a forward-reading unit, NOT rearranged into a full natural-Korean sentence.

Rules:
- Keep the English reading order. Do NOT reorder chunks into natural Korean sentence order.
- Translate each chunk on its own; use neighbouring chunks only to pick the right particle/tense.
- Keep each gloss short and spoken, like a 직독직해 cue. Examples:
    "I went" → "나는 갔다"
    "to Pusan" → "부산으로"
    "President Lee went" → "이 대통령은 갔다"
    "to Italy" → "이탈리아로"
    "because the economy" → "경제가"
    "was struggling" → "어려움을 겪고 있었기 때문에"
- Provide a gloss for EVERY index, exactly once.
- Korean only — no romanization, no English, no extra commentary.

Chunks:
${numbered}

Return JSON: { "glosses": [ { "i": <index>, "ko": "<직독직해>" }, ... ] } covering every index.`;
}

/**
 * Align raw glosses (any order, possibly missing/extra) to a length-`count`
 * array, indexed by chunk position. Out-of-range or malformed entries are
 * dropped; missing indices stay "". Pure & deterministic.
 */
export function alignGlosses(count: number, raw: RawGloss[]): string[] {
  const out = new Array<string>(count).fill("");
  for (const g of raw) {
    if (
      g &&
      Number.isInteger(g.i) &&
      g.i >= 0 &&
      g.i < count &&
      typeof g.ko === "string"
    ) {
      out[g.i] = g.ko.trim();
    }
  }
  return out;
}

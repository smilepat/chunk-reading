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
  q?: string; // 추임새 — short Korean role prompt murmured before the cue (누가/어디로/왜…)
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

ALSO, for EACH chunk, give "q": a very short Korean 추임새 — the guiding role-word a teacher
murmurs BEFORE the cue to signal what this chunk answers in the sentence. Examples:
    "President Lee went" → q "누가", ko "이 대통령은 갔다"
    "to Italy" → q "어디로", ko "이탈리아로"
    "to meet the prime minister." → q "무엇하러", ko "총리를 만나기 위해"
    "Because the economy was struggling," → q "왜", ko "경제가 어려움을 겪고 있었기 때문에"
    "he asked" → q "누가 어떻게 했나", ko "그는 요청했다"
    "for new trade deals" → q "무엇을", ko "새로운 무역 협정을"
    "that could help both countries" → q "어떤", ko "양국이 돕는 데 도움이 될 수 있는"
Pick the most natural one per chunk (누가/누구를/무엇이/무엇을/어디로/어디서/언제/왜/어떻게/무엇하러/어떤 등).
For abstract/argumentative text (no clear 누가/어디로), prefer discourse-role 추임새 instead:
    주장은 / 근거는 / 예시로 / 대조적으로 / 조건은 / 결과는 / 이유는 / 핵심 개념은 등.
q values must be DISCRIMINATIVE across the passage: never repeat the same bare q
(e.g. "무엇을" twice). When the same role would repeat, add ONE tiny distinguishing
word from the chunk's meaning:
    "we ignore the invisible advantages" → q "무엇을 무시?"
    "to view individual actions" → q "무엇을 보는?"
Keep q very short (1~3 어절). Korean only.

Chunks:
${numbered}

Return JSON: { "glosses": [ { "i": <index>, "ko": "<직독직해>", "q": "<추임새>" }, ... ] } covering every index.`;
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

/**
 * Align the 추임새 role prompts (`q`) the same way alignGlosses aligns `ko`:
 * indexed by chunk position, out-of-range/malformed dropped, missing stay "".
 * Pure & deterministic.
 */
export function alignRoles(count: number, raw: RawGloss[]): string[] {
  const out = new Array<string>(count).fill("");
  for (const g of raw) {
    if (
      g &&
      Number.isInteger(g.i) &&
      g.i >= 0 &&
      g.i < count &&
      typeof g.q === "string"
    ) {
      out[g.i] = g.q.trim();
    }
  }
  return out;
}

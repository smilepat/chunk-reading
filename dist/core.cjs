'use strict';

// src/core/chunk.ts
var STRONG = /* @__PURE__ */ new Set([
  "who",
  "whom",
  "whose",
  "which",
  "that",
  "when",
  "where",
  "while",
  "because",
  "although",
  "though",
  "if",
  "unless",
  "since",
  "until",
  "whether",
  "whereas",
  "wherever",
  "whenever",
  "but",
  "yet"
]);
var WEAK = /* @__PURE__ */ new Set([
  "in",
  "on",
  "at",
  "by",
  "for",
  "with",
  "from",
  "to",
  "into",
  "onto",
  "over",
  "under",
  "above",
  "below",
  "about",
  "after",
  "before",
  "between",
  "through",
  "during",
  "without",
  "within",
  "against",
  "among",
  "around",
  "across",
  "behind",
  "beyond",
  "toward",
  "towards",
  "upon",
  "near",
  "as",
  "than",
  "once"
]);
var MIN_WORDS = 2;
function core(word) {
  return word.toLowerCase().replace(/^[^a-z]+/, "").replace(/[^a-z]+$/, "");
}
function words(text, start, end) {
  const out = [];
  const re = /\S+/g;
  const sub = text.slice(start, end);
  let m;
  while ((m = re.exec(sub)) !== null) {
    const s = start + m.index;
    out.push({ start: s, end: s + m[0].length, text: m[0] });
  }
  return out;
}
function boundaryStarts(ws) {
  if (ws.length === 0) return [];
  const starts = [0];
  let count = 1;
  for (let i = 1; i < ws.length; i++) {
    const afterPunct = /[,;:.!?–—]$/.test(ws[i - 1].text);
    const w = core(ws[i].text);
    let brk = false;
    if (afterPunct) brk = true;
    else if (STRONG.has(w)) brk = true;
    else if (WEAK.has(w) && count >= MIN_WORDS) brk = true;
    if (brk) {
      starts.push(i);
      count = 1;
    } else {
      count++;
    }
  }
  return starts;
}
function chunkSpan(text, start, end) {
  const ws = words(text, start, end);
  const starts = boundaryStarts(ws);
  return starts.map((from, k) => {
    var _a;
    const to = ((_a = starts[k + 1]) != null ? _a : ws.length) - 1;
    const s = ws[from].start;
    const e = ws[to].end;
    return { text: text.slice(s, e), start: s, end: e };
  });
}
function splitSentences(text) {
  const spans = [];
  const re = /\S[\s\S]*?(?:[.!?]+(?=\s|$)|(?=\n\s*\n)|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m[0].trim().length > 0) {
      spans.push({ start: m.index, end: m.index + m[0].length });
    }
    if (re.lastIndex === m.index) re.lastIndex++;
  }
  return spans;
}
function chunkText(text) {
  return splitSentences(text).flatMap((s) => chunkSpan(text, s.start, s.end));
}
function paragraphChunks(text, chunks) {
  const groups = [];
  let cur = [];
  chunks.forEach((c, i) => {
    if (i > 0 && /\n[^\S\n]*\n/.test(text.slice(chunks[i - 1].end, c.start))) {
      groups.push(cur);
      cur = [];
    }
    cur.push({ c, gi: i });
  });
  if (cur.length) groups.push(cur);
  return groups;
}

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

exports.alignGlosses = alignGlosses;
exports.buildGlossPrompt = buildGlossPrompt;
exports.chunkSpan = chunkSpan;
exports.chunkText = chunkText;
exports.paragraphChunks = paragraphChunks;
exports.splitSentences = splitSentences;
//# sourceMappingURL=core.cjs.map
//# sourceMappingURL=core.cjs.map
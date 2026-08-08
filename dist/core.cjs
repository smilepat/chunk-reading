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
var WH_REL = /* @__PURE__ */ new Set(["who", "whom", "whose", "which"]);
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
  let fuse = false;
  for (let i = 1; i < ws.length; i++) {
    const afterPunct = /[,;:.!?–—]$/.test(ws[i - 1].text);
    const w = core(ws[i].text);
    const next = i + 1 < ws.length ? core(ws[i + 1].text) : "";
    const prepRel = WEAK.has(w) && WH_REL.has(next);
    let brk = false;
    if (afterPunct) brk = true;
    else if (fuse) brk = false;
    else if (prepRel) brk = true;
    else if (STRONG.has(w)) brk = true;
    else if (WEAK.has(w) && count >= MIN_WORDS) brk = true;
    fuse = prepRel;
    if (brk) {
      starts.push(i);
      count = 1;
    } else {
      count++;
    }
  }
  return mergeLoneFunctionWords(ws, starts);
}
function mergeLoneFunctionWords(ws, starts) {
  var _a;
  const isFn = (i) => {
    const w = core(ws[i].text);
    return WEAK.has(w) || STRONG.has(w);
  };
  let k = 0;
  while (k < starts.length) {
    const from = starts[k];
    const to = (_a = starts[k + 1]) != null ? _a : ws.length;
    if (to - from === 1 && isFn(from)) {
      if (k + 1 < starts.length) {
        starts.splice(k + 1, 1);
        continue;
      }
      if (k > 0) {
        starts.splice(k, 1);
        continue;
      }
    }
    k++;
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

ALSO, for EACH chunk, give "q": a very short Korean \uCD94\uC784\uC0C8 \u2014 the guiding role-word a teacher
murmurs BEFORE the cue to signal what this chunk answers in the sentence. Examples:
    "President Lee went" \u2192 q "\uB204\uAC00", ko "\uC774 \uB300\uD1B5\uB839\uC740 \uAC14\uB2E4"
    "to Italy" \u2192 q "\uC5B4\uB514\uB85C", ko "\uC774\uD0C8\uB9AC\uC544\uB85C"
    "to meet the prime minister." \u2192 q "\uBB34\uC5C7\uD558\uB7EC", ko "\uCD1D\uB9AC\uB97C \uB9CC\uB098\uAE30 \uC704\uD574"
    "Because the economy was struggling," \u2192 q "\uC65C", ko "\uACBD\uC81C\uAC00 \uC5B4\uB824\uC6C0\uC744 \uACAA\uACE0 \uC788\uC5C8\uAE30 \uB54C\uBB38\uC5D0"
    "he asked" \u2192 q "\uB204\uAC00 \uC5B4\uB5BB\uAC8C \uD588\uB098", ko "\uADF8\uB294 \uC694\uCCAD\uD588\uB2E4"
    "for new trade deals" \u2192 q "\uBB34\uC5C7\uC744", ko "\uC0C8\uB85C\uC6B4 \uBB34\uC5ED \uD611\uC815\uC744"
    "that could help both countries" \u2192 q "\uC5B4\uB5A4", ko "\uC591\uAD6D\uC774 \uB3D5\uB294 \uB370 \uB3C4\uC6C0\uC774 \uB420 \uC218 \uC788\uB294"
Pick the most natural one per chunk (\uB204\uAC00/\uB204\uAD6C\uB97C/\uBB34\uC5C7\uC774/\uBB34\uC5C7\uC744/\uC5B4\uB514\uB85C/\uC5B4\uB514\uC11C/\uC5B8\uC81C/\uC65C/\uC5B4\uB5BB\uAC8C/\uBB34\uC5C7\uD558\uB7EC/\uC5B4\uB5A4 \uB4F1).
For abstract/argumentative text (no clear \uB204\uAC00/\uC5B4\uB514\uB85C), prefer discourse-role \uCD94\uC784\uC0C8 instead:
    \uC8FC\uC7A5\uC740 / \uADFC\uAC70\uB294 / \uC608\uC2DC\uB85C / \uB300\uC870\uC801\uC73C\uB85C / \uC870\uAC74\uC740 / \uACB0\uACFC\uB294 / \uC774\uC720\uB294 / \uD575\uC2EC \uAC1C\uB150\uC740 \uB4F1.
q values must be DISCRIMINATIVE across the passage: never repeat the same bare q
(e.g. "\uBB34\uC5C7\uC744" twice). When the same role would repeat, add ONE tiny distinguishing
word from the chunk's meaning:
    "we ignore the invisible advantages" \u2192 q "\uBB34\uC5C7\uC744 \uBB34\uC2DC?"
    "to view individual actions" \u2192 q "\uBB34\uC5C7\uC744 \uBCF4\uB294?"
Keep q very short (1~3 \uC5B4\uC808). Korean only.

Chunks:
${numbered}

Return JSON: { "glosses": [ { "i": <index>, "ko": "<\uC9C1\uB3C5\uC9C1\uD574>", "q": "<\uCD94\uC784\uC0C8>" }, ... ] } covering every index.`;
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
function alignRoles(count, raw) {
  const out = new Array(count).fill("");
  for (const g of raw) {
    if (g && Number.isInteger(g.i) && g.i >= 0 && g.i < count && typeof g.q === "string") {
      out[g.i] = g.q.trim();
    }
  }
  return out;
}

exports.alignGlosses = alignGlosses;
exports.alignRoles = alignRoles;
exports.buildGlossPrompt = buildGlossPrompt;
exports.chunkSpan = chunkSpan;
exports.chunkText = chunkText;
exports.paragraphChunks = paragraphChunks;
exports.splitSentences = splitSentences;
//# sourceMappingURL=core.cjs.map
//# sourceMappingURL=core.cjs.map
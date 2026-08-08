export { alignGlosses, alignRoles, buildGlossPrompt } from './chunk-2UWOYLLA.js';

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

export { chunkSpan, chunkText, paragraphChunks, splitSentences };
//# sourceMappingURL=core.js.map
//# sourceMappingURL=core.js.map
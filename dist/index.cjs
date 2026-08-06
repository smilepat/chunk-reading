"use client";
'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

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
function isEnglishVoice(v) {
  return !!v && /^en/i.test(v.lang || "");
}
function voiceScore(v) {
  let s = 0;
  if (/en[-_]?US/i.test(v.lang)) s += 5;
  else if (/en[-_]?(GB|AU|CA)/i.test(v.lang)) s += 3;
  else if (v.lang.toLowerCase().startsWith("en")) s += 1;
  if (!v.localService) s += 3;
  if (/google|natural|aria|jenny|guy|ava|samantha|libby|sonia|emma/i.test(v.name))
    s += 2;
  return s;
}
function bestEnglishVoice(voices) {
  const en = voices.filter(isEnglishVoice);
  if (en.length === 0) return null;
  return [...en].sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}
function useEnglishVoices() {
  const [voices, setVoices] = react.useState([]);
  const [voiceURI, setVoiceURI] = react.useState("");
  const [ready, setReady] = react.useState(false);
  const voiceRef = react.useRef(null);
  react.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setReady(true);
    const load = () => {
      const all = window.speechSynthesis.getVoices();
      setVoices(all);
      if (!voiceRef.current) {
        const best = bestEnglishVoice(all);
        if (best) {
          voiceRef.current = best;
          setVoiceURI(best.voiceURI);
        }
      }
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
      window.speechSynthesis.cancel();
    };
  }, []);
  const select = react.useCallback((uri) => {
    var _a;
    voiceRef.current = (_a = window.speechSynthesis.getVoices().find((v) => v.voiceURI === uri)) != null ? _a : null;
    setVoiceURI(uri);
  }, []);
  const resolve = react.useCallback(() => {
    if (isEnglishVoice(voiceRef.current)) return voiceRef.current;
    const en = window.speechSynthesis.getVoices().filter(isEnglishVoice);
    if (en.length > 0) {
      const best = bestEnglishVoice(en);
      if (!voiceRef.current) voiceRef.current = best;
      return best;
    }
    return voiceRef.current;
  }, []);
  const speak = react.useCallback(
    (text, rate = 0.85) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = resolve();
      if (v) u.voice = v;
      u.lang = isEnglishVoice(v) ? v.lang : "en-US";
      u.rate = rate;
      window.speechSynthesis.speak(u);
    },
    [resolve]
  );
  const cancel = react.useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  }, []);
  const enVoices = voices.filter(isEnglishVoice);
  const otherVoices = voices.filter((v) => !isEnglishVoice(v));
  return { ready, voices, enVoices, otherVoices, voiceURI, select, speak, cancel };
}

// src/react/glossClient.ts
function createFetchGlossFn(endpoint = "/api/gloss") {
  return async (chunks) => {
    var _a, _b, _c;
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chunks })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((_a = data == null ? void 0 : data.error) != null ? _a : `gloss request failed (${res.status})`);
    return {
      glosses: (_b = data.glosses) != null ? _b : [],
      roles: (_c = data.roles) != null ? _c : []
    };
  };
}
function hashText(t) {
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = (h << 5) + h + t.charCodeAt(i) | 0;
  return `cr.${(h >>> 0).toString(36)}.${t.length}`;
}
function normalizeCues(res) {
  var _a, _b;
  if (Array.isArray(res)) return { glosses: res, roles: [] };
  return { glosses: (_a = res.glosses) != null ? _a : [], roles: (_b = res.roles) != null ? _b : [] };
}
var S = {
  root: { display: "flex", flexDirection: "column", gap: 16, color: "#111827", fontSize: 14, lineHeight: 1.5 },
  hint: { fontSize: 12, color: "#6b7280", margin: 0 },
  controls: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 },
  btn: { border: "1px solid #d1d5db", background: "#fff", borderRadius: 8, padding: "4px 10px", color: "#4b5563", cursor: "pointer", font: "inherit" },
  count: { fontVariantNumeric: "tabular-nums", color: "#6b7280" },
  card: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: 16 },
  head: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 4, marginBottom: 8, fontSize: 11, fontWeight: 500, color: "#9ca3af" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", textAlign: "left", border: "none", background: "transparent", borderRadius: 6, padding: "4px 8px", cursor: "pointer", font: "inherit", alignItems: "baseline" },
  // 추임새 칸이 있을 때의 3칸 그리드 — head/row가 같은 열 폭을 써야 세로줄이 맞음
  head3: { gridTemplateColumns: "88px 1fr 1fr" },
  row3: { gridTemplateColumns: "88px 1fr 1fr" },
  role: { fontSize: 13, fontWeight: 600, color: "#0d9488" },
  ko: { fontSize: 16, fontWeight: 500, color: "#1f2937" },
  enFaint: { fontSize: 18, color: "#cbd5e1" },
  enShown: { fontSize: 18, color: "#111827", background: "#fef3c7", borderRadius: 4, padding: "0 4px" },
  warn: { border: "1px solid #fcd34d", background: "#fffbeb", borderRadius: 8, padding: 10, fontSize: 12, color: "#b45309", margin: 0 },
  loading: { fontSize: 14, color: "#9ca3af", margin: 0 },
  para: { marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12 }
};
function ChunkReading({
  text,
  glossFn,
  glossEndpoint = "/api/gloss",
  rate: initialRate = 0.85,
  speakOnReveal = true,
  cacheKey,
  className,
  style
}) {
  const chunks = react.useMemo(() => chunkText(text), [text]);
  const paragraphs = react.useMemo(() => paragraphChunks(text, chunks), [text, chunks]);
  const [glosses, setGlosses] = react.useState(null);
  const [roles, setRoles] = react.useState([]);
  const [loading, setLoading] = react.useState(false);
  const [error, setError] = react.useState(null);
  const [revealed, setRevealed] = react.useState(/* @__PURE__ */ new Set());
  const [rate, setRate] = react.useState(initialRate);
  const { ready, voices, enVoices, otherVoices, voiceURI, select, speak, cancel } = useEnglishVoices();
  const key = cacheKey != null ? cacheKey : hashText(text);
  const reqId = react.useRef(0);
  const resolveGloss = glossFn != null ? glossFn : createFetchGlossFn(glossEndpoint);
  function load(force = false) {
    const id = ++reqId.current;
    setError(null);
    setRevealed(/* @__PURE__ */ new Set());
    if (!force && typeof sessionStorage !== "undefined") {
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) {
          const cues = normalizeCues(JSON.parse(cached));
          if (cues.glosses.length === chunks.length) {
            setGlosses(cues.glosses);
            setRoles(cues.roles);
            return;
          }
        }
      } catch {
      }
    }
    if (chunks.length === 0) {
      setGlosses([]);
      setRoles([]);
      return;
    }
    setGlosses(null);
    setRoles([]);
    setLoading(true);
    resolveGloss(chunks.map((c) => c.text)).then((res) => {
      if (reqId.current !== id) return;
      const cues = normalizeCues(res);
      setGlosses(cues.glosses);
      setRoles(cues.roles);
      try {
        sessionStorage.setItem(key, JSON.stringify(cues));
      } catch {
      }
    }).catch((e) => {
      if (reqId.current !== id) return;
      setError(e instanceof Error ? e.message : String(e));
      setGlosses([]);
      setRoles([]);
    }).finally(() => {
      if (reqId.current === id) setLoading(false);
    });
  }
  react.useEffect(() => {
    load();
  }, [key]);
  const total = chunks.length;
  const hasRoles = roles.some(Boolean);
  function reveal(gi, en) {
    setRevealed((prev) => {
      if (prev.has(gi)) return prev;
      const next = new Set(prev);
      next.add(gi);
      return next;
    });
    if (speakOnReveal) speak(en, rate);
  }
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { className, style: { ...S.root, ...style }, children: [
    /* @__PURE__ */ jsxRuntime.jsxs("p", { style: S.hint, children: [
      "\uD55C\uAD6D\uC5B4 ",
      /* @__PURE__ */ jsxRuntime.jsx("b", { children: "\uC9C1\uB3C5\uC9C1\uD574 cue" }),
      "\uB97C \uBCF4\uACE0 \uC601\uC5B4 \uD45C\uD604\uC744 \uB5A0\uC62C\uB824 \uBCF4\uC138\uC694. \uC601\uC5B4\uB294 \uCC98\uC74C\uC5D4 \uD76C\uBBF8\uD558\uAC8C \uAE54\uB824 \uC788\uACE0, ",
      /* @__PURE__ */ jsxRuntime.jsx("b", { children: "\uB204\uB974\uBA74 \uC120\uBA85\uD574\uC9C0\uBA70 \uC6D0\uC5B4\uBBFC \uBC1C\uC74C" }),
      "\uC73C\uB85C \uC77D\uC5B4\uC918\uC694."
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { style: S.controls, children: [
      /* @__PURE__ */ jsxRuntime.jsxs("span", { style: S.count, children: [
        revealed.size,
        " / ",
        total,
        " \uD655\uC778"
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          style: S.btn,
          onClick: () => setRevealed(new Set(chunks.map((_, i) => i))),
          children: "\uC601\uC5B4 \uC804\uCCB4 \uBCF4\uAE30"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          style: S.btn,
          onClick: () => {
            cancel();
            setRevealed(/* @__PURE__ */ new Set());
          },
          children: "\u21BA \uB2E4\uC2DC \uAC00\uB9AC\uAE30"
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs("label", { style: { display: "flex", alignItems: "center", gap: 8, color: "#4b5563" }, children: [
        "\uC18D\uB3C4",
        /* @__PURE__ */ jsxRuntime.jsx(
          "input",
          {
            type: "range",
            min: 0.6,
            max: 1.1,
            step: 0.05,
            value: rate,
            onChange: (e) => setRate(Number(e.target.value))
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs("span", { style: S.count, children: [
          rate.toFixed(2),
          "\xD7"
        ] })
      ] }),
      ready && voices.length > 0 && /* @__PURE__ */ jsxRuntime.jsxs("label", { style: { display: "flex", alignItems: "center", gap: 8, color: "#4b5563" }, children: [
        "\uBC1C\uC74C",
        /* @__PURE__ */ jsxRuntime.jsxs(
          "select",
          {
            value: voiceURI,
            onChange: (e) => select(e.target.value),
            style: { maxWidth: 220, border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 6px", color: "#374151" },
            children: [
              enVoices.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("optgroup", { label: "\uC601\uC5B4 (\uC6D0\uC5B4\uBBFC)", children: enVoices.map((v) => /* @__PURE__ */ jsxRuntime.jsxs("option", { value: v.voiceURI, children: [
                v.name,
                " (",
                v.lang,
                ")"
              ] }, v.voiceURI)) }),
              otherVoices.length > 0 && /* @__PURE__ */ jsxRuntime.jsx("optgroup", { label: "\uAE30\uD0C0 \uC5B8\uC5B4", children: otherVoices.map((v) => /* @__PURE__ */ jsxRuntime.jsxs("option", { value: v.voiceURI, children: [
                v.name,
                " (",
                v.lang,
                ")"
              ] }, v.voiceURI)) })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(
        "button",
        {
          type: "button",
          style: { ...S.btn, opacity: loading ? 0.4 : 1 },
          onClick: () => load(true),
          disabled: loading,
          children: "\u21BB cue \uB2E4\uC2DC \uC0DD\uC131"
        }
      )
    ] }),
    ready && enVoices.length === 0 && /* @__PURE__ */ jsxRuntime.jsxs("p", { style: S.warn, children: [
      "\u26A0\uFE0F \uC774 \uBE0C\uB77C\uC6B0\uC800/\uAE30\uAE30\uC5D0 \uC601\uC5B4 \uC74C\uC131\uC774 \uC5C6\uC5B4 \uD55C\uAD6D\uC5B4 \uC74C\uC131\uC73C\uB85C \uC77D\uD790 \uC218 \uC788\uC5B4\uC694.",
      /* @__PURE__ */ jsxRuntime.jsx("b", { children: " Chrome" }),
      "\uC5D0\uC11C \uC5F4\uBA74 \u201CGoogle US English\u201D \uC6D0\uC5B4\uBBFC \uC74C\uC131\uC744 \uC4F8 \uC218 \uC788\uC5B4\uC694."
    ] }),
    error && /* @__PURE__ */ jsxRuntime.jsxs("p", { style: S.warn, children: [
      "\u26A0\uFE0F \uC9C1\uB3C5\uC9C1\uD574 cue\uB97C \uB9CC\uB4E4\uC9C0 \uBABB\uD588\uC5B4\uC694(",
      error,
      "). \uC601\uC5B4 \uCCAD\uD06C\uB9CC \uD45C\uC2DC\uB429\uB2C8\uB2E4.",
      /* @__PURE__ */ jsxRuntime.jsx("b", { children: " \u21BB cue \uB2E4\uC2DC \uC0DD\uC131" }),
      "\uC73C\uB85C \uB2E4\uC2DC \uC2DC\uB3C4\uD560 \uC218 \uC788\uC5B4\uC694."
    ] }),
    loading && /* @__PURE__ */ jsxRuntime.jsx("p", { style: S.loading, children: "\uC9C1\uB3C5\uC9C1\uD574 cue \uC0DD\uC131 \uC911\u2026" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { style: S.card, children: [
      /* @__PURE__ */ jsxRuntime.jsxs("div", { style: hasRoles ? { ...S.head, ...S.head3 } : S.head, children: [
        hasRoles && /* @__PURE__ */ jsxRuntime.jsx("span", { children: "\uCD94\uC784\uC0C8" }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { children: "\uD55C\uAD6D\uC5B4 cue (\uC9C1\uB3C5\uC9C1\uD574)" }),
        /* @__PURE__ */ jsxRuntime.jsx("span", { children: "English (\uB20C\uB7EC\uC11C \uD655\uC778)" })
      ] }),
      paragraphs.map((para, pi) => /* @__PURE__ */ jsxRuntime.jsx("div", { style: pi > 0 ? S.para : void 0, children: para.map(({ c, gi }) => {
        var _a;
        const isRev = revealed.has(gi);
        const ko = (_a = glosses == null ? void 0 : glosses[gi]) != null ? _a : "";
        return /* @__PURE__ */ jsxRuntime.jsxs(
          "button",
          {
            type: "button",
            style: hasRoles ? { ...S.row, ...S.row3 } : S.row,
            onClick: () => reveal(gi, c.text),
            title: "\uB20C\uB7EC\uC11C \uC601\uC5B4 \uD655\uC778 + \uBC1C\uC74C \uB4E3\uAE30",
            children: [
              hasRoles && /* @__PURE__ */ jsxRuntime.jsx("span", { style: S.role, children: roles[gi] || "" }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: S.ko, children: ko || (loading ? "\u2026" : "\u2014") }),
              /* @__PURE__ */ jsxRuntime.jsx("span", { style: isRev ? S.enShown : S.enFaint, children: c.text })
            ]
          },
          gi
        );
      }) }, pi))
    ] })
  ] });
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

exports.ChunkReading = ChunkReading;
exports.alignGlosses = alignGlosses;
exports.bestEnglishVoice = bestEnglishVoice;
exports.buildGlossPrompt = buildGlossPrompt;
exports.chunkSpan = chunkSpan;
exports.chunkText = chunkText;
exports.createFetchGlossFn = createFetchGlossFn;
exports.isEnglishVoice = isEnglishVoice;
exports.paragraphChunks = paragraphChunks;
exports.splitSentences = splitSentences;
exports.useEnglishVoices = useEnglishVoices;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map
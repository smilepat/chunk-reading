// Deterministic meaning-unit (sense-group) chunker — no AI, runs offline and
// consistently. Every chunk is an EXACT slice of the source text, so a UI can map
// chunks back to the passage without offset drift (0 drop by construction).

import type { Chunk } from "./types";

// Strong clause boundaries — start a new chunk even after a single word
// (subordinators, relative/wh-words, contrastive coordinators).
const STRONG = new Set<string>([
  "who", "whom", "whose", "which", "that", "when", "where", "while",
  "because", "although", "though", "if", "unless", "since", "until",
  "whether", "whereas", "wherever", "whenever", "but", "yet",
]);

// Weaker phrase boundaries (prepositions, infinitive "to") — only break when the
// current chunk already holds at least MIN_WORDS, to avoid fragmenting short NPs.
// "of" is intentionally excluded: of-genitives bind tightly ("a lot of energy").
const WEAK = new Set<string>([
  "in", "on", "at", "by", "for", "with", "from", "to", "into", "onto",
  "over", "under", "above", "below", "about", "after", "before", "between",
  "through", "during", "without", "within", "against", "among", "around",
  "across", "behind", "beyond", "toward", "towards", "upon", "near",
  "as", "than", "once",
]);

const MIN_WORDS = 2;

// 전치사와 결합해 관계절을 여는 wh-관계사 — "the degree to which ..." 처럼
// "전치사+관계사"는 쪼개지 않고 통째로 뒤 절의 머리로 붙인다.
const WH_REL = new Set<string>(["who", "whom", "whose", "which"]);

/** Lowercase a token and strip leading/trailing non-letters ("(that," -> "that"). */
function core(word: string): string {
  return word.toLowerCase().replace(/^[^a-z]+/, "").replace(/[^a-z]+$/, "");
}

interface Word {
  start: number;
  end: number;
  text: string;
}

/** Non-whitespace runs in text[start,end), with absolute offsets. */
function words(text: string, start: number, end: number): Word[] {
  const out: Word[] = [];
  const re = /\S+/g;
  const sub = text.slice(start, end);
  let m: RegExpExecArray | null;
  while ((m = re.exec(sub)) !== null) {
    const s = start + m.index;
    out.push({ start: s, end: s + m[0].length, text: m[0] });
  }
  return out;
}

/**
 * Core boundary engine. Given the span's words, return the word indices where a
 * NEW chunk starts (always includes 0). Boundaries fall BEFORE clause/phrase
 * markers and AFTER punctuation.
 */
function boundaryStarts(ws: Word[]): number[] {
  if (ws.length === 0) return [];
  const starts = [0];
  let count = 1; // words in the current chunk
  let fuse = false; // 직전 단어가 "전치사+관계사"의 전치사 → 이번 관계사에서 끊지 않음
  for (let i = 1; i < ws.length; i++) {
    const afterPunct = /[,;:.!?–—]$/.test(ws[i - 1].text);
    const w = core(ws[i].text);
    const next = i + 1 < ws.length ? core(ws[i + 1].text) : "";
    const prepRel = WEAK.has(w) && WH_REL.has(next); // "to which", "in which" …

    let brk = false;
    if (afterPunct) brk = true;
    else if (fuse) brk = false; // 관계사를 전치사에 붙여 한 청크로
    else if (prepRel) brk = true; // 전치사+관계사는 뒤 절의 머리 — 항상 여기서 끊음
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

/**
 * 한 단어짜리 기능어(전치사/접속사) 청크는 학생에게 무의미하므로 이웃 청크에 합친다.
 * 뒤 청크가 있으면 뒤에 붙이고(구를 여는 말이므로), 마지막 청크면 앞에 붙인다.
 */
function mergeLoneFunctionWords(ws: Word[], starts: number[]): number[] {
  const isFn = (i: number): boolean => {
    const w = core(ws[i].text);
    return WEAK.has(w) || STRONG.has(w);
  };
  let k = 0;
  while (k < starts.length) {
    const from = starts[k];
    const to = starts[k + 1] ?? ws.length;
    if (to - from === 1 && isFn(from)) {
      if (k + 1 < starts.length) {
        starts.splice(k + 1, 1); // 뒤 청크와 합침
        continue; // 합쳐진 청크를 같은 자리에서 재검사
      }
      if (k > 0) {
        starts.splice(k, 1); // 마지막 청크면 앞 청크와 합침
        continue;
      }
    }
    k++;
  }
  return starts;
}

/** Split text[start,end) into sense-group chunks for meaning-unit reading. */
export function chunkSpan(text: string, start: number, end: number): Chunk[] {
  const ws = words(text, start, end);
  const starts = boundaryStarts(ws);
  return starts.map((from, k) => {
    const to = (starts[k + 1] ?? ws.length) - 1;
    const s = ws[from].start;
    const e = ws[to].end;
    return { text: text.slice(s, e), start: s, end: e };
  });
}

/**
 * Split raw text into sentence spans (exact offsets). Heuristic: a sentence ends
 * at a run of . ! ? followed by whitespace/EOF, or at a blank line (paragraph
 * break). Good enough for a reading aid; abbreviations may over-split (rare).
 */
export function splitSentences(text: string): { start: number; end: number }[] {
  const spans: { start: number; end: number }[] = [];
  const re = /\S[\s\S]*?(?:[.!?]+(?=\s|$)|(?=\n\s*\n)|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m[0].trim().length > 0) {
      spans.push({ start: m.index, end: m.index + m[0].length });
    }
    if (re.lastIndex === m.index) re.lastIndex++; // guard against zero-length match
  }
  return spans;
}

/**
 * Chunk an entire passage in reading order. Sentences are split deterministically
 * first so chunks never cross a sentence boundary; offsets index into `text`.
 */
export function chunkText(text: string): Chunk[] {
  return splitSentences(text).flatMap((s) => chunkSpan(text, s.start, s.end));
}

/**
 * Group chunks into paragraphs (by blank lines between them) and attach each
 * chunk's global index (gi) — a rendering aid to keep passages readable.
 */
export function paragraphChunks(
  text: string,
  chunks: Chunk[],
): { c: Chunk; gi: number }[][] {
  const groups: { c: Chunk; gi: number }[][] = [];
  let cur: { c: Chunk; gi: number }[] = [];
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

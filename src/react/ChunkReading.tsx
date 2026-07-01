"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { chunkText, paragraphChunks } from "../core/chunk";
import type { GlossFn } from "../core/types";
import { useEnglishVoices } from "./useEnglishVoices";
import { createFetchGlossFn } from "./glossClient";

export interface ChunkReadingProps {
  /** The English passage to practise (plain text; blank lines = paragraphs). */
  text: string;
  /**
   * Custom 직독직해 backend `(chunks) => Promise<koGlosses>`. If omitted, POSTs to
   * `glossEndpoint` (default `/api/gloss` — mount the bundled route there).
   */
  glossFn?: GlossFn;
  /** Endpoint for the default fetch backend (ignored when `glossFn` is given). */
  glossEndpoint?: string;
  /** Initial TTS rate (0.6–1.1). Default 0.85 (slightly slow for EFL). */
  rate?: number;
  /** Speak the English aloud when a chunk is revealed. Default true. */
  speakOnReveal?: boolean;
  /** sessionStorage cache key for the generated cues. Default: hash of `text`. */
  cacheKey?: string;
  /** Extra class/style on the root element. */
  className?: string;
  style?: CSSProperties;
}

function hashText(t: string): string {
  let h = 5381;
  for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
  return `cr.${(h >>> 0).toString(36)}.${t.length}`;
}

const S: Record<string, CSSProperties> = {
  root: { display: "flex", flexDirection: "column", gap: 16, color: "#111827", fontSize: 14, lineHeight: 1.5 },
  hint: { fontSize: 12, color: "#6b7280", margin: 0 },
  controls: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 },
  btn: { border: "1px solid #d1d5db", background: "#fff", borderRadius: 8, padding: "4px 10px", color: "#4b5563", cursor: "pointer", font: "inherit" },
  count: { fontVariantNumeric: "tabular-nums", color: "#6b7280" },
  card: { border: "1px solid #e5e7eb", background: "#fff", borderRadius: 12, padding: 16 },
  head: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderBottom: "1px solid #f3f4f6", paddingBottom: 4, marginBottom: 8, fontSize: 11, fontWeight: 500, color: "#9ca3af" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", textAlign: "left", border: "none", background: "transparent", borderRadius: 6, padding: "4px 8px", cursor: "pointer", font: "inherit", alignItems: "baseline" },
  ko: { fontSize: 16, fontWeight: 500, color: "#1f2937" },
  enFaint: { fontSize: 18, color: "#cbd5e1" },
  enShown: { fontSize: 18, color: "#111827", background: "#fef3c7", borderRadius: 4, padding: "0 4px" },
  warn: { border: "1px solid #fcd34d", background: "#fffbeb", borderRadius: 8, padding: 10, fontSize: 12, color: "#b45309", margin: 0 },
  loading: { fontSize: 14, color: "#9ca3af", margin: 0 },
  para: { marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 12 },
};

/**
 * 🇰🇷 직독직해 (read-in-order) cue practice.
 *
 * Splits a passage into sense-group chunks and shows a short Korean cue for each,
 * with the English laid over faintly. The learner reads the Korean cue, recalls
 * the English, then taps the chunk to reveal it clearly and hear a native voice.
 *
 * Drop-in and self-contained: inline styles (no CSS framework required), bring
 * your own cue backend via `glossFn`, or point `glossEndpoint` at the bundled
 * `/api/gloss` route (see `chunk-reading/server`).
 */
export function ChunkReading({
  text,
  glossFn,
  glossEndpoint = "/api/gloss",
  rate: initialRate = 0.85,
  speakOnReveal = true,
  cacheKey,
  className,
  style,
}: ChunkReadingProps) {
  const chunks = useMemo(() => chunkText(text), [text]);
  const paragraphs = useMemo(() => paragraphChunks(text, chunks), [text, chunks]);

  const [glosses, setGlosses] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [rate, setRate] = useState(initialRate);

  const { ready, voices, enVoices, otherVoices, voiceURI, select, speak, cancel } =
    useEnglishVoices();

  const key = cacheKey ?? hashText(text);
  const reqId = useRef(0);
  const resolveGloss: GlossFn = glossFn ?? createFetchGlossFn(glossEndpoint);

  function load(force = false) {
    const id = ++reqId.current;
    setError(null);
    setRevealed(new Set());
    if (!force && typeof sessionStorage !== "undefined") {
      try {
        const cached = sessionStorage.getItem(key);
        if (cached) {
          const arr = JSON.parse(cached) as string[];
          if (Array.isArray(arr) && arr.length === chunks.length) {
            setGlosses(arr);
            return;
          }
        }
      } catch {
        /* ignore cache errors */
      }
    }
    if (chunks.length === 0) {
      setGlosses([]);
      return;
    }
    setGlosses(null);
    setLoading(true);
    resolveGloss(chunks.map((c) => c.text))
      .then((arr) => {
        if (reqId.current !== id) return;
        setGlosses(arr);
        try {
          sessionStorage.setItem(key, JSON.stringify(arr));
        } catch {
          /* ignore */
        }
      })
      .catch((e: unknown) => {
        if (reqId.current !== id) return;
        setError(e instanceof Error ? e.message : String(e));
        setGlosses([]); // still show the English chunks
      })
      .finally(() => {
        if (reqId.current === id) setLoading(false);
      });
  }

  // 마운트/지문 변경 시 cue 로드(세션 캐시 → 미스면 백엔드). 외부 데이터 동기화.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // load()는 props 파생값만 사용 — key(=지문) 변화에만 재실행.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const total = chunks.length;

  function reveal(gi: number, en: string) {
    setRevealed((prev) => {
      if (prev.has(gi)) return prev;
      const next = new Set(prev);
      next.add(gi);
      return next;
    });
    if (speakOnReveal) speak(en, rate);
  }

  return (
    <div className={className} style={{ ...S.root, ...style }}>
      <p style={S.hint}>
        한국어 <b>직독직해 cue</b>를 보고 영어 표현을 떠올려 보세요. 영어는 처음엔
        희미하게 깔려 있고, <b>누르면 선명해지며 원어민 발음</b>으로 읽어줘요.
      </p>

      <div style={S.controls}>
        <span style={S.count}>
          {revealed.size} / {total} 확인
        </span>
        <button
          type="button"
          style={S.btn}
          onClick={() => setRevealed(new Set(chunks.map((_, i) => i)))}
        >
          영어 전체 보기
        </button>
        <button
          type="button"
          style={S.btn}
          onClick={() => {
            cancel();
            setRevealed(new Set());
          }}
        >
          ↺ 다시 가리기
        </button>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#4b5563" }}>
          속도
          <input
            type="range"
            min={0.6}
            max={1.1}
            step={0.05}
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
          />
          <span style={S.count}>{rate.toFixed(2)}×</span>
        </label>
        {ready && voices.length > 0 && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#4b5563" }}>
            발음
            <select
              value={voiceURI}
              onChange={(e) => select(e.target.value)}
              style={{ maxWidth: 220, border: "1px solid #d1d5db", borderRadius: 6, padding: "4px 6px", color: "#374151" }}
            >
              {enVoices.length > 0 && (
                <optgroup label="영어 (원어민)">
                  {enVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
              {otherVoices.length > 0 && (
                <optgroup label="기타 언어">
                  {otherVoices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
        )}
        <button
          type="button"
          style={{ ...S.btn, opacity: loading ? 0.4 : 1 }}
          onClick={() => load(true)}
          disabled={loading}
        >
          ↻ cue 다시 생성
        </button>
      </div>

      {ready && enVoices.length === 0 && (
        <p style={S.warn}>
          ⚠️ 이 브라우저/기기에 영어 음성이 없어 한국어 음성으로 읽힐 수 있어요.
          <b> Chrome</b>에서 열면 “Google US English” 원어민 음성을 쓸 수 있어요.
        </p>
      )}
      {error && (
        <p style={S.warn}>
          ⚠️ 직독직해 cue를 만들지 못했어요({error}). 영어 청크만 표시됩니다.
          <b> ↻ cue 다시 생성</b>으로 다시 시도할 수 있어요.
        </p>
      )}
      {loading && <p style={S.loading}>직독직해 cue 생성 중…</p>}

      <div style={S.card}>
        <div style={S.head}>
          <span>한국어 cue (직독직해)</span>
          <span>English (눌러서 확인)</span>
        </div>
        {paragraphs.map((para, pi) => (
          <div key={pi} style={pi > 0 ? S.para : undefined}>
            {para.map(({ c, gi }) => {
              const isRev = revealed.has(gi);
              const ko = glosses?.[gi] ?? "";
              return (
                <button
                  key={gi}
                  type="button"
                  style={S.row}
                  onClick={() => reveal(gi, c.text)}
                  title="눌러서 영어 확인 + 발음 듣기"
                >
                  <span style={S.ko}>{ko || (loading ? "…" : "—")}</span>
                  <span style={isRev ? S.enShown : S.enFaint}>{c.text}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

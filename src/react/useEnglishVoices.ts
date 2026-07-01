"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** True for an English voice (en-US / en-GB / …). */
export function isEnglishVoice(v: SpeechSynthesisVoice | null | undefined): boolean {
  return !!v && /^en/i.test(v.lang || "");
}

/** Rank an English voice — prefer native-sounding en-US, then cloud/"Natural". */
function voiceScore(v: SpeechSynthesisVoice): number {
  let s = 0;
  if (/en[-_]?US/i.test(v.lang)) s += 5;
  else if (/en[-_]?(GB|AU|CA)/i.test(v.lang)) s += 3;
  else if (v.lang.toLowerCase().startsWith("en")) s += 1;
  if (!v.localService) s += 3; // cloud voices (e.g. Google) sound more native
  if (/google|natural|aria|jenny|guy|ava|samantha|libby|sonia|emma/i.test(v.name))
    s += 2;
  return s;
}

/** Best native-English voice available, or null. */
export function bestEnglishVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  const en = voices.filter(isEnglishVoice);
  if (en.length === 0) return null;
  return [...en].sort((a, b) => voiceScore(b) - voiceScore(a))[0];
}

/**
 * Shared native-English Web Speech state: loads voices (async), defaults to the
 * most native-sounding one, and exposes speak/cancel that NEVER read English with
 * a non-English voice (re-scans at speak time so late-loading voices count).
 */
export function useEnglishVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState("");
  const [ready, setReady] = useState(false);
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    // 브라우저 TTS 가용 여부 동기화(외부 시스템) — 의도된 effect 내 setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const select = useCallback((uri: string) => {
    voiceRef.current =
      window.speechSynthesis.getVoices().find((v) => v.voiceURI === uri) ?? null;
    setVoiceURI(uri);
  }, []);

  const resolve = useCallback((): SpeechSynthesisVoice | null => {
    if (isEnglishVoice(voiceRef.current)) return voiceRef.current;
    const en = window.speechSynthesis.getVoices().filter(isEnglishVoice);
    if (en.length > 0) {
      const best = bestEnglishVoice(en);
      if (!voiceRef.current) voiceRef.current = best;
      return best;
    }
    return voiceRef.current;
  }, []);

  const speak = useCallback(
    (text: string, rate = 0.85) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const v = resolve();
      if (v) u.voice = v;
      u.lang = isEnglishVoice(v) ? v!.lang : "en-US"; // force English phonetics
      u.rate = rate;
      window.speechSynthesis.speak(u);
    },
    [resolve],
  );

  const cancel = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  }, []);

  const enVoices = voices.filter(isEnglishVoice);
  const otherVoices = voices.filter((v) => !isEnglishVoice(v));
  return { ready, voices, enVoices, otherVoices, voiceURI, select, speak, cancel };
}

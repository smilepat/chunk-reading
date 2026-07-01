"use client";

import { useState } from "react";
import { ChunkReading } from "chunk-reading";

const SAMPLE = `President Lee went to Italy to meet the prime minister.

Because the economy was struggling, he asked for new trade deals that could help both countries grow.`;

export default function Home() {
  const [text, setText] = useState(SAMPLE);
  const [active, setActive] = useState(SAMPLE);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          chunk-reading — 직독직해 cue
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          영어 지문을 의미 단위로 끊고, 한국어 직독직해 cue를 보며 영어를 떠올리는
          연습. 아래 <code className="rounded bg-gray-100 px-1">&lt;ChunkReading&gt;</code>{" "}
          컴포넌트 하나로 다른 앱에 그대로 붙일 수 있어요.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          className="w-full rounded-xl border border-gray-300 p-4 text-base leading-7 focus:border-gray-900 focus:outline-none"
          placeholder="영어 지문을 붙여넣으세요…"
        />
        <button
          type="button"
          onClick={() => setActive(text)}
          disabled={text.trim().length === 0}
          className="self-start rounded-lg bg-gray-900 px-5 py-2 font-medium text-white disabled:opacity-40"
        >
          연습 시작
        </button>
      </div>

      <ChunkReading key={active} text={active} />
    </main>
  );
}

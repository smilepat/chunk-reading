# chunk-reading

**직독직해 (Korean read-in-order) cue practice** as a drop-in React component.

Split an English passage into meaning-unit chunks, show a short **Korean cue** for
each (`I went` → `나는 갔다`, `to Pusan` → `부산으로`) with the English laid over
**faintly** — the learner reads the cue, recalls the English, then taps a chunk to
reveal it and hear a **native voice**.

Extracted from [Interactive Reading Coach](https://interactive-reading-coach.vercel.app) so it can live on its own and be embedded in other apps.

- 🧩 **Deterministic chunker** — exact source slices, 0 offset drift, no AI needed.
- 🇰🇷 **AI 직독직해 cues** — Gemini backend included, or inject your own.
- 🔊 **Native English TTS** — auto-picks the best English voice (Web Speech API).
- 🎨 **Self-contained** — inline styles, no CSS framework required on the host.
- 📦 **Right RSC boundary** — client component under `.`, pure/server code under `./core` and `./server`.

---

## Install

```bash
npm install github:smilepat/chunk-reading   # or, once published: npm i chunk-reading
```

Peer deps: `react >=18`, `react-dom >=18`.

## Quick start (Next.js App Router)

**1. Mount the bundled cue backend** (needs a `GEMINI_API_KEY` in the environment):

```ts
// app/api/gloss/route.ts
import { createGlossRoute } from "chunk-reading/server";
export const runtime = "nodejs";
export const POST = createGlossRoute();
```

**2. Drop the component in** — it POSTs to `/api/gloss` by default:

```tsx
"use client";
import { ChunkReading } from "chunk-reading";

export default function Page() {
  return <ChunkReading text="President Lee went to Italy to meet the prime minister." />;
}
```

That's it. No CSS import required.

## Bring your own cue backend

Skip the bundled route entirely and inject a `glossFn` — any AI, cache, or your
own translation service. It receives the ordered chunks and returns one Korean
gloss per chunk, in the same order:

```tsx
<ChunkReading
  text={passage}
  glossFn={async (chunks) => {
    const res = await fetch("/my/endpoint", { method: "POST", body: JSON.stringify({ chunks }) });
    return (await res.json()).glosses; // string[] aligned to chunks
  }}
/>
```

Or point the default fetch client at a different URL:

```tsx
<ChunkReading text={passage} glossEndpoint="/api/my-gloss" />
```

## Props

| prop            | type                                  | default        | notes |
| --------------- | ------------------------------------- | -------------- | ----- |
| `text`          | `string`                              | —              | passage to practise (blank lines = paragraphs) |
| `glossFn`       | `(chunks: string[]) => Promise<string[]>` | fetch `glossEndpoint` | custom cue backend |
| `glossEndpoint` | `string`                              | `/api/gloss`   | used by the default fetch client |
| `rate`          | `number`                              | `0.85`         | TTS speed (0.6–1.1) |
| `speakOnReveal` | `boolean`                             | `true`         | speak the English when revealed |
| `cacheKey`      | `string`                              | hash of `text` | sessionStorage cache key for cues |
| `className` / `style` | —                               | —              | applied to the root element |

## Core (framework-agnostic, server-safe)

Use the chunker / prompt helpers anywhere (no React, no `"use client"`):

```ts
import { chunkText, buildGlossPrompt, alignGlosses } from "chunk-reading/core";

const chunks = chunkText("I went to Pusan.");
//  → [{ text: "I went", start, end }, { text: "to Pusan.", start, end }]
```

## Server backend

```ts
import { glossChunks } from "chunk-reading/server";

const ko = await glossChunks(["I went", "to Pusan"], { apiKey: process.env.GEMINI_API_KEY });
//  → ["나는 갔다", "부산으로"]
```

`glossChunks` returns cues aligned by index, so a dropped or reordered item from
the model never shifts the rest.

## The gloss contract

Any backend you plug in must satisfy: **input** `{ chunks: string[] }` →
**output** `{ glosses: string[] }` where `glosses[i]` is the Korean 직독직해 for
`chunks[i]` (same length, same order). `createGlossRoute()` and `glossChunks`
already do this.

## Run the demo

```bash
cp .env.example .env.local   # add your GEMINI_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Develop the library

```bash
npm test          # vitest (chunker + gloss aligner)
npm run build:lib # tsup → dist/ (esm + cjs + d.ts)
npm run lint
```

## License

MIT

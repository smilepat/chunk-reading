---
project: chunk-reading
status: active
progress: 80
updated: 2026-07-01
pc: DESKTOP-JDF6C5D
---

# chunk-reading — STATUS

## 🎯 한 줄 상태
Interactive Reading Coach의 **🇰🇷 직독직해 cue 기능을 독립 패키지로 분리**. npm 패키지(React 컴포넌트) + 프레임워크 무관 코어 + 번들 Gemini 백엔드 + Next.js 데모 앱. 다른 앱(book-collector·csat-mastery 등)에 `<ChunkReading/>` 하나로 통합.

## 📊 진행 체크리스트
- [x] 코어(프레임워크 무관): 결정론 청커(`chunkText`/`chunkSpan`/`splitSentences`/`paragraphChunks`)
      + 직독직해 프롬프트/정렬(`buildGlossPrompt`/`alignGlosses`) — 0-drop, 단위 테스트.
- [x] React: `<ChunkReading>` 컴포넌트(인라인 스타일=호스트 CSS 불필요) + `useEnglishVoices`
      TTS 훅 + 기본 fetch gloss 클라이언트(`createFetchGlossFn`).
- [x] 서버: `glossChunks`(Gemini) + `createGlossRoute()`(Next/fetch 런타임용 POST 핸들러).
- [x] 진입점 3개: `.`(client, "use client" 배너) · `./core`(pure) · `./server`(genai). tsup 이중 빌드.
- [x] 데모 Next.js 앱: textarea→`<ChunkReading>` + `/api/gloss`(번들 라우트). `chunk-reading` 별칭으로
      공개 API 그대로 dogfooding.
- [x] 문서: README(설치·번들라우트·주입식 glossFn·core·server·gloss 계약) + LICENSE(MIT) + .env.example.
- [ ] `npm install`(prepare→tsup) · `npm test` · `npm run build`(데모) · `npx eslint` 검증
- [ ] GitHub 레포 생성(smilepat/chunk-reading) + 초기 커밋 푸시
- [ ] (선택) Vercel 데모 배포 + GEMINI_API_KEY 등록
- [ ] (선택) npm publish (지금은 `github:smilepat/chunk-reading`로 설치 가능)

## ⏭️ 다음에 할 일 (Next Actions)
1. 실제 소비 앱(csat-mastery/book-collector)에 `npm i github:smilepat/chunk-reading` 후
   `<ChunkReading/>` + `/api/gloss` 라우트 붙여 통합 검증.
2. (선택) Vercel에 데모 배포하고 GEMINI_API_KEY 등록.
3. (선택) 청크 리딩(순차 클릭 + ▶ 자동 재생) 컴포넌트도 이 패키지에 추가할지 결정.
4. (선택) npm publish로 공개 배포.

## 🤔 결정 대기 (Decisions Needed)
- 스코프 확장: 직독직해 cue만 유지 vs 청크 순차읽기/자동재생까지 이 패키지에 포함.
- 배포 채널: GitHub 설치만 유지 vs npm publish.

## 🔗 Claude Code 재개 프롬프트
"STATUS.md 읽고 chunk-reading 이어서 하자 — 소비 앱에 통합 검증하고 필요하면 Vercel 데모 배포·npm publish"

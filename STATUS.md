---
project: chunk-reading
status: active
progress: 93
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
- [x] `npm install`(prepare→tsup) · `npm test`(10) · `npm run build`(데모 next build) ·
      `npx eslint` 전부 통과. lib 빌드 esm/cjs/d.ts + `. `에 "use client" 정확 배치 확인.
- [x] GitHub 레포 생성(smilepat/chunk-reading, **private**, 기본 브랜치 main) + 초기 커밋 푸시.
- [x] **Vercel 데모 배포**: <https://chunk-reading.vercel.app> (team prompt-improvement-dm-pat).
      GEMINI_API_KEY 등록(Production/Development). `/api/gloss` 라이브 스모크 통과.
      주의: PowerShell 파이프가 BOM(U+FEFF)을 주입 → `cmd`의 `<` 리다이렉션으로 키 주입해 해결.
- [x] **소비 앱 통합(csat-mastery) — 프로덕션 검증 완료**: `src/app/api/gloss`(번들 라우트) +
      `src/app/literal`(직독직해 페이지). <https://csat-mastery.vercel.app/literal> 200 + `/api/gloss`
      cue 3개 정상. 기존 학습 플로우 무수정.
      함정 3가지 해결: (1) **repo private → public 전환**(Vercel이 git 의존성 fetch 가능).
      (2) csat는 **pnpm** 프로젝트 → npm으로 설치해 pnpm-lock 미갱신으로 frozen-lockfile 빌드
      실패 → `pnpm install`로 lock 동기화. (3) csat GEMINI_API_KEY가 **HTTP-referer 제한**(브라우저용)
      이라 서버 gloss 403 → Google Cloud에서 애플리케이션 제한을 **없음**(API 제한은 Gemini API 유지)으로
      풀어 서버 호출 허용. 임시 우회(GLOSS_GEMINI_KEY) 제거, 라우트는 `createGlossRoute()`로 원복.
      최종: csat 자기 GEMINI_API_KEY로 `/api/gloss` 프로덕션 검증 완료.
- [x] **패키지 배포 방식**: prebuilt `dist/` 저장소 커밋 + `prepare` 제거(설치시 빌드 X) →
      소비 앱 설치가 빠르고 devDep 불필요. 유지보수 시 `npm run build:lib` 후 dist 커밋.
- [ ] (선택) csat-mastery `learn/[slug]`의 `passage_text`에 `<ChunkReading/>` 임베드(학습 플로우 내).
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

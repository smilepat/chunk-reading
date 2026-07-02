# chunk-reading — HANDOFF

> 다른 PC/세션에서 재개하기 위한 한 장 요약. 운영 상태는 [`STATUS.md`](STATUS.md), 사용법은 [`README.md`](README.md).
> 최종 작업: **2026-07-01**. 상태: **패키지 완성 + 데모 배포 + csat-mastery 통합(전용 페이지 + 학습 플로우) 라이브.**

## 한 줄 요약

한국 학습자의 **직독직해(read-in-order) cue 연습**을 어느 React/Next 앱에나 붙이는 드롭인 컴포넌트. 지문을 의미 단위 청크로 끊고, 청크별 **한국어 cue**(예: `I went`→`나는 갔다`, `to Pusan`→`부산으로`)를 주며 영어는 희미하게 깔아둠 → 누르면 선명해지고 **원어민 발음**. Interactive Reading Coach의 🇰🇷 직독직해 기능을 독립 패키지로 추출한 것.

## 세 앱의 관계 (이번 세션 전체 맥락)

| 앱 | 역할 | URL |
|---|---|---|
| **interactive-reading-coach** | 원본 — 직독직해 cue 모드가 처음 만들어진 곳(+ 연결모드 단순화, 청크리딩 개편) | <https://interactive-reading-coach.vercel.app> |
| **chunk-reading** (이 repo) | 직독직해 기능을 독립 npm 패키지 + 데모로 추출 | <https://chunk-reading.vercel.app> · <https://github.com/smilepat/chunk-reading> |
| **csat-mastery** | 패키지를 실제 소비 — `/literal` 페이지 + `learn/[slug]` 학습 플로우 임베드 | <https://csat-mastery.vercel.app/literal> |

## 재개 첫 단계

```bash
cd D:\chunk-reading
npm install        # 최초 1회 (dist는 이미 커밋돼 있음)
npm test           # vitest — 청커/gloss 정렬 10개
npm run build:lib  # tsup → dist/ (esm+cjs+d.ts). 소스 변경 시 재실행 후 dist 커밋
npm run build      # 데모 next build + 타입체크
npm run dev        # http://localhost:3000 (데모, .env.local에 GEMINI_API_KEY 필요)
```

> ⚠️ NTFS 드라이브에서 빌드(이 repo는 D:). `npm run build:lib`는 `tsconfig.build.json`을 씀(Next가 tsconfig.json에 자동 주입하는 `incremental`과 분리해 .d.ts emit 오류 회피).

## 아키텍처 (진입점 3개 — RSC 경계 보존)

```text
src/
  index.ts          →  "." 진입점.  "use client" (빌드 후 강제 삽입).  <ChunkReading/> + 브라우저 헬퍼
  core/index.ts     →  "./core".   순수·서버안전(no React). chunkText/chunkSpan/splitSentences/
                                    paragraphChunks + buildGlossPrompt/alignGlosses
  server.ts         →  "./server". @google/genai 사용. glossChunks() + createGlossRoute()
  react/            ChunkReading.tsx(인라인 스타일=호스트 CSS 불필요) · useEnglishVoices · glossClient
```

- **빌드**: `tsup.config.ts`가 두 번 빌드 — index(use client 배너 삽입) / core+server(배너 없음). esbuild가 소스의 "use client" 디렉티브를 제거하므로 `onSuccess`에서 dist/index.{js,cjs} 첫 줄에 다시 주입한다.
- **배포 방식**: prebuilt `dist/`를 저장소에 **커밋**(전역 gitignore가 dist/를 막아 `git add -f dist` 필요). `prepare` 제거 → 소비 앱이 `npm i github:smilepat/chunk-reading` 시 빌드 없이 즉시 설치. **유지보수 시: 소스 변경 → `npm run build:lib` → `git add -f dist` → commit.**

## gloss 계약 (백엔드 교체 지점)

`POST {chunks: string[]} → {glosses: string[]}` — `glosses[i]`는 `chunks[i]`의 한국어 직독직해(같은 길이·순서). 기본은 `/api/gloss`로 fetch(`createFetchGlossFn`), 또는 `<ChunkReading glossFn={...}/>`로 자체 백엔드 주입. 정렬은 인덱스 기반(`alignGlosses`)이라 모델이 항목을 빠뜨려도 밀리지 않음.

## csat-mastery 통합 방식 (참고 구현)

- 설치: `chunk-reading`(github). **csat는 pnpm 프로젝트** → `pnpm install`로 lock 동기화 필수.
- `src/app/api/gloss/route.ts`: `export const POST = createGlossRoute()` (runtime nodejs). csat 자기 `GEMINI_API_KEY` 사용.
- `src/app/literal/page.tsx`: 지문 입력 + `<ChunkReading/>` 전용 페이지.
- `src/app/learn/[slug]/page.tsx`: 지문(`passage_text`) 있는 문제에 "🇰🇷 직독직해로 끊어읽기" 토글(기본 접힘, `key={task_id}`로 재마운트). 기존 문제 풀이 플로우 무수정.

## 겪은 함정 & 해결 (재발 방지)

1. **private repo → Vercel CI 설치 불가**: git 의존성을 CI가 fetch 못함 → repo **public 전환**.
2. **npm vs pnpm lockfile**: csat는 pnpm인데 npm으로 설치 → `pnpm-lock.yaml` 미갱신 → Vercel `--frozen-lockfile` 실패 → `pnpm install`로 동기화.
3. **HTTP-referer 제한 키**: csat GEMINI_API_KEY가 브라우저용(referer 제한) → 서버 gloss 403 → Google Cloud에서 **애플리케이션 제한=없음**(API 제한은 Gemini API 유지)으로 해제.
4. **PowerShell 파이프 BOM**: `$key | vercel env add`가 값 앞에 U+FEFF 주입 → 키 400/500 → `cmd`의 `< 파일` 리다이렉션(ASCII 파일)으로 우회.
5. **tsup .d.ts `incremental` 오류**: tsconfig.json의 incremental이 dts emit과 충돌 → `tsconfig.build.json`으로 분리.
6. **esbuild가 "use client" 제거**: tsup `onSuccess`에서 dist 첫 줄 재삽입.

## 다음에 할 일 (Next Actions)

1. (선택) **npm publish** — 지금은 `github:smilepat/chunk-reading`로 설치. `npm publish --access public`(prepublishOnly가 tsup 실행). semver 태그로 버전 고정 권장.
2. (선택) csat 외 다른 앱(book-collector 등)에 통합 — 영어 지문 표시 화면이 있을 때.
3. (선택) 스코프 확장 — IRC의 청크 순차읽기/자동재생 컴포넌트도 이 패키지에 추가.
4. (선택) cue 영속화 — 현재 sessionStorage(docId) 캐시. 소비 앱 DB에 저장하면 AI 재호출 0.

## 🔗 재개 프롬프트

"chunk-reading HANDOFF/STATUS 읽고 이어서 하자 — 필요하면 npm publish 하거나 다른 앱에 통합"

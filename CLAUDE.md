# PeakFit — 프로젝트 컨텍스트 (Claude Code용)

이 파일은 새 세션이 이 프로젝트를 처음 접해도 지금까지의 맥락을 빠르게 파악할 수 있도록 기록한 문서입니다.
"작업 규칙" 섹션은 지시로 취급하고, 나머지는 참고용 배경 정보입니다.

## 프로젝트 개요

**PeakFit** — 근력 운동 루틴과 몸무게를 기록/관리하는 운동 트래커. 한국어/일본어 지원(기본 일본어).

- **프론트엔드**: `frontend/` — Next.js 16(App Router, Turbopack) + TypeScript + Tailwind CSS v4
- **백엔드**: `backend/` — Spring Boot 3.5.3 + Java 21 + Spring Security(JWT) + Spring Data JPA + Flyway
- **DB**: PostgreSQL 16
- **배포**: 프론트 [Vercel](https://peakfit-ten.vercel.app), 백엔드 [Render](https://habitfit-api.onrender.com) + DB [Neon](https://neon.tech) — 자세한 이전 경위/주의사항은 "배포 인프라" 섹션 참고
- GitHub: `q0103888/habitfit-api`
- **현재 작업 브랜치**: `v6` (main과 동일 지점에서 시작, 아직 이 브랜치 자체 커밋 없음)

## 로컬 실행

```bash
docker compose up -d                      # DB
cd backend && export JAVA_HOME=/usr/local/Cellar/openjdk@21/21.0.12/libexec/openjdk.jdk/Contents/Home && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev # 반드시 포트 3100 (package.json에 -p 3100 고정, 백엔드 CORS가 3100만 허용)
```

로컬 `java` 기본값은 Java 11이므로 `./mvnw` 실행 전 항상 `JAVA_HOME`을 위처럼 export해야 함.

## 배포 인프라

**현재**: Vercel(프론트) + Render(백엔드) + Neon(DB Postgres).

- 2026-08 말: Vercel + **Railway**(백엔드+DB)로 최초 배포
- 2026-09-29: Railway 무료 체험이 끝나 백엔드가 완전히 죽음(`Application not found`) → **Render(백엔드) + Neon(DB)으로 이전**
  - **코드 변경은 전혀 없었음** — `backend/src/main/resources/application.properties`가 처음부터 `${DATABASE_URL:...}`, `${JWT_SECRET:...}` 등 환경변수 placeholder로만 돼있어서, 호스팅 대시보드에서 환경변수만 교체하면 되는 구조. Dockerfile도 그냥 `EXPOSE 8080`이라 문제 없었음
  - Render에 설정한 환경변수: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`(Neon 연결정보), `JWT_SECRET`, `ANTHROPIC_API_KEY`, `GOOGLE_CLIENT_ID`, `CORS_ALLOWED_ORIGINS`(Vercel 도메인)
  - Vercel에는 `NEXT_PUBLIC_API_BASE_URL`을 새 Render 주소로 교체
  - Render Web Service 생성 시 **Root Directory를 `backend`로 지정 필수**(모노레포라 안 하면 빌드 실패 — Railway 때도 같은 이유로 한 번 겪었던 문제)
- **주의 1**: Render 무료 플랜은 일정 시간 미사용 시 슬립되고, 첫 요청 때 콜드스타트로 20~40초 정도 걸림(정상 동작, 재시도하면 뜸)
- **주의 2**: Next.js의 `NEXT_PUBLIC_*` 환경변수는 **빌드 시점**에 코드에 박힘 — Vercel에서 값만 바꾸고 재배포(redeploy)를 안 하면 반영 안 됨. 이번 이전 때 실제로 이 문제로 헤맴(옛 Railway 주소로 계속 요청 나감) → `main` 브랜치에 새 커밋 push해서 자동 재배포 트리거로 해결
- **주의 3**: Render 자체 무료 Postgres는 30일 후 자동 삭제되므로 절대 쓰지 말 것 — 반드시 Neon(영구 무료 티어) 사용
- Railway는 이제 서비스 자체가 사라진 상태라 더 이상 유효한 배포처가 아님(계정을 지운 건 아니라 프로젝트를 다시 살릴 수는 있지만, 이전을 이미 완료했으므로 불필요)

## 디자인 시스템 — "Kinetic Obsidian"

Google Stitch로 만든 디자인 명세를 기반으로 전체 UI를 리디자인함(2026-09-09~09-17).

- **폰트**: Inter(본문) + JetBrains Mono(숫자/지표) — `next/font/google`로 로드, `frontend/src/app/layout.tsx`
- **아이콘**: Material Symbols Outlined(리게이처 기반). `frontend/src/components/material-icon.tsx`의 `<MaterialIcon name="..." />`로 사용. lucide-react는 대부분 제거했지만 `BodyPartIcon`(부위별 커스텀 아이콘)은 의도적으로 유지
- **색상 토큰**: `frontend/src/app/globals.css`의 `@theme inline` 안에 정의된 Material Design 3 스타일 시맨틱 토큰 — `surface`, `surface-container`, `surface-container-lowest/low/high/highest`, `on-surface`, `on-surface-variant`, `primary`(`#ccff80`), `primary-container`(`#a3e635`), `on-primary-container`, `secondary`(`#4ae176`), `tertiary`(`#def1ff`), `error`(`#ffb4ab`) 등. 옛날 `bg-black`/`bg-zinc-*`/`bg-lime-400` 클래스는 전부 이 토큰으로 교체됨
- **카드 스타일**: 글래스모피즘 — `rounded-2xl bg-white/[0.04] backdrop-blur-xl shadow-md` 패턴, 주요 요소에는 라임색 "kinetic glow" box-shadow

**리디자인 완료 화면(전부)**: 대시보드(`/`), 루틴(`/routine`), 캘린더(`/calendar`), 운동 도감(`/exercises`), 통계(`/stats`), 로그인(`/login`), 회원가입(`/signup`), AI 코치 위젯, `SetPanel`(세트 기록 패널), 모바일 네비게이션(사이드바 드로어). **더 이상 옛 스타일로 남아있는 화면 없음.**

**리디자인 시 지킨 원칙**(앞으로 새 화면/기능 작업 시에도 동일하게 적용):
1. 기존 state/handler/API 호출은 100% 유지, 레이아웃/스타일만 교체
2. Stitch 목업의 가짜/미구현 지표(CNS Readiness, 심박수, RPE, ACWR, 팀 텔레메트리, PRO ATHLETE 뱃지, 가짜 후기, "SSO" 뱃지 등)는 전부 제거하고 실제로 계산 가능한 데이터로 대체
3. Stitch가 제안한 기능이 백엔드에 이미 있는데 프론트가 안 쓰고 있었다면(예: 주간 네비게이션) 진짜 기능으로 구현
4. 한 화면씩 순서대로 진행 + 매번 `npm run build` && `npm run test`로 검증

## 주요 기능

- **AI 운동 코치**: `backend/.../assistant/AssistantService.java` — Claude API(Tool Use, `anthropic-java` SDK) 기반. 유저의 실제 스트릭/운동 히스토리/회복 상태/부위 비중을 조회하는 4개 read-only 도구 보유(전부 기존 `RoutineService` 메서드 재사용). 질문 언어 그대로 답하도록 시스템 프롬프트 설정됨. 대화 기록은 계정별 localStorage에 저장(`assistant-widget.tsx`), 서버엔 저장 안 함. 우측 하단 플로팅 버튼(`smart_toy` 아이콘)
  - 알려진 한계: 사용량 제한(rate limit) 없음 — 보류 중 (아래 참고)
- **구글 로그인**: ID 토큰 방식(리다이렉트 없음), `AuthService.loginWithGoogle()`이 이메일 find-or-create. `email_verified` 검증 포함(보안 리뷰에서 추가). 버튼은 구글 기본 위젯이 아니라 **커스텀 디자인 버튼 위에 투명한 실제 구글 버튼을 오버레이**하는 방식(`google-signin-button.tsx`) — 구글 기본 테마로는 Stitch 디자인을 재현할 수 없어서 이렇게 처리
- **유산소 운동 시간 기록**: 기존엔 모든 운동이 무게x횟수만 기록 가능했는데, `bodyPart === "CARDIO"`인 운동은 시간(분) 기준으로 기록
  - DB: `workout_sets.duration_min` 컬럼(V4 마이그레이션), `weight_kg`/`reps`는 nullable
  - 세트 하나는 `{weightKg, reps}` 또는 `{durationMin}` 중 하나만 채워짐(서로 배타적)
  - `RoutineService.exerciseHistory()`가 유산소면 "총 운동 시간"을, 아니면 "최고 무게/총 볼륨"을 계산
  - `SetPanel`/통계 페이지 종목별 추이 섹션 전부 유산소 여부에 따라 폼/차트가 분기됨
  - 대시보드/루틴/캘린더의 "총 볼륨(kg)"은 null-safe 처리돼서 유산소 세트는 자연히 0으로 빠짐(의도된 동작 — 그 지표는 무게 훈련량 전용)
- **모바일 네비게이션**: `Sidebar`가 `hidden lg:flex`라 1024px 미만에서는 화면 이동 수단이 아예 없던 버그가 있었음 → `frontend/src/components/sidebar.tsx`에 좌측 상단 플로팅 메뉴 버튼(`fixed left-4 top-4 lg:hidden`) + 슬라이드인 드로어 추가(백드롭 클릭/페이지 이동 시 자동 닫힘), 데스크톱 사이드바와 내용 공유. 각 페이지 헤더에 `pl-16`을 줘서 버튼과 안 겹치게 함

## 작업 규칙 (반드시 준수)

- **커밋 메시지는 일본어로 작성**(사용자 명시적 요청)
- 커밋 메시지 끝에 항상 추가:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01GUjCMb1RioCHqZgwqBo6a2
  ```
- **브랜치 전략**: 작업은 `v1 → v2 → ... → v6(현재)` 순서로 새 브랜치를 만들어 진행. 작업 끝나면 그 브랜치에 커밋 → push → 다음 세션을 위해 `v(N+1)` 브랜치를 새로 만들어 push해둠
- **main에는 직접 push 금지, 항상 PR로**: 예전엔 `git push origin vN:main`으로 바로 fast-forward했지만, 이제 그렇게 하지 말고 항상 `gh pr create`로 `vN → main` PR을 만들어서 병합할 것(예: `gh pr merge --merge`). main 브랜치 보호/이력 관리를 위한 규칙
- **`.env` 계열 파일은 절대 커밋/푸시하지 않기**: `.gitignore`에 이미 `.env*`가 등록돼있지만, 커밋 전엔 항상 `git status`로 의도치 않게 스테이징된 `.env`/시크릿 파일이 없는지 확인할 것
- 실제 데이터로 검증 불가능한 지표/기능은 만들지 않기(위 "디자인 시스템" 원칙 참고) — 프로젝트 전체에 적용되는 철학
- 화면/기능 변경 후엔 항상 `npm run build`(frontend) / `./mvnw test`(backend, JAVA_HOME export 필수)로 검증
- UI 변경은 가능하면 실제 브라우저(chrome-devtools)로 확인 — 특히 모바일 뷰포트 등 레이아웃 관련 변경은 필수
- 프로덕션 DB/서버에 직접 접근하는 대신, 가능하면 실제 API를 호출하는 스크립트로 처리(더 안전함)

## 트리거 키워드

사용자가 **"테스트커밋"**이라고 말하면 아래를 순서대로 자동 실행:
1. 프론트엔드: `npm run build && npm run test`
2. 백엔드: `JAVA_HOME=/usr/local/Cellar/openjdk@21/21.0.12/libexec/openjdk.jdk/Contents/Home ./mvnw test`
3. 둘 다 통과하면: `git status`로 `.env` 등 의도치 않은 파일 없는지 확인 → 변경된 파일만 `git add` → 일본어 커밋 메시지(+ 위의 Co-Authored-By/Claude-Session footer)로 커밋 → **현재 작업 브랜치**(main이 아님)에 push
4. 하나라도 실패하면 커밋/푸시하지 말고 실패 원인만 보고
- main으로 병합하는 것까지는 포함 안 함(위 "main에는 직접 push 금지, 항상 PR로" 규칙에 따라 PR은 별도 요청 시에만)
- Notion에도 개발 일지·기능 구현 방식·DB 설계서를 기록 중 — 큰 변경사항은 Notion에도 반영 요청받을 수 있음
5. push 완료 후 결과 요약 출력

## 아직 안 한 것 / 보류된 것

- AI 어시스턴트 rate-limiting (보안 리뷰에서 발견, 명시적으로 보류)
- 카카오/라인 소셜 로그인 (구글만 우선 구현)
- 팀/그룹 기능 (대시보드에 더미 위젯만 존재, 실제 기능 없음) — 팀 초대 메일 기능은 이게 먼저 있어야 붙일 수 있음
- 회원가입 이메일 인증 (서비스는 Resend로 정함, 아직 미착수)
- 팀 초대 메일/카카오톡/라인 — 이메일은 Resend로 무료 가능. 카카오/라인은 "공유 버튼"(무료, 사용자가 직접 전달) 아니면 유료 비즈메시지(사업자 등록+건당 과금) 중 선택 필요, 미결정

## 진행 이력 (요약)

- 8월: 초기 구현(로그인/루틴 CRUD/세트·몸무게 기록/통계/캘린더/다국어/운동 카탈로그 460개/테스트+CI/Vercel+Railway 최초 배포)
- 9/8: AI 운동 코치(Claude Tool Use), 구글 로그인 추가
- 9/9: UI 전면 리디자인(Kinetic Obsidian) 8개 화면 + 유산소 시간 기록 기능
- 9/16~17: `SetPanel` 리디자인, 모바일 네비게이션 추가 — 이로써 전 화면 리디자인 완료
- 9/29: Railway 만료로 Render+Neon 이전, README에 배포 주소 추가, 더미 데이터 재시딩(`test1234@naver.com`)
- 9/30: 새 세션 인수인계용으로 이 문서 전체 정리

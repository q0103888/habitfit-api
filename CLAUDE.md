# PeakFit — 프로젝트 컨텍스트 (Claude Code용)

이 파일은 새 세션이 이 프로젝트를 처음 접해도 지금까지의 맥락을 빠르게 파악할 수 있도록 기록한 문서입니다.
작업 규칙(아래 "작업 규칙" 섹션)은 지시로 취급하고, 나머지는 참고용 배경 정보입니다.

## 프로젝트 개요

**PeakFit** — 근력 운동 루틴과 몸무게를 기록/관리하는 운동 트래커. 한국어/일본어 지원(기본 일본어).

- **프론트엔드**: `frontend/` — Next.js 16(App Router, Turbopack) + TypeScript + Tailwind CSS v4
- **백엔드**: `backend/` — Spring Boot 3.5.3 + Java 21 + Spring Security(JWT) + Spring Data JPA + Flyway
- **DB**: PostgreSQL 16
- **배포**: 프론트 Vercel(`https://peakfit-ten.vercel.app`), 백엔드+DB Railway(`https://habitfit-api-production.up.railway.app`)
  - Railway는 계속 유지하기로 결정함(대안으로 Render+Neon을 검토했으나 보류)
- GitHub: `q0103888/habitfit-api`

## 로컬 실행

```bash
docker compose up -d                      # DB
cd backend && export JAVA_HOME=/usr/local/Cellar/openjdk@21/21.0.12/libexec/openjdk.jdk/Contents/Home && ./mvnw spring-boot:run
cd frontend && npm install && npm run dev # 반드시 포트 3100 (package.json에 -p 3100 고정, 백엔드 CORS가 3100만 허용)
```

로컬 `java` 기본값은 Java 11이므로 `./mvnw` 실행 전 항상 `JAVA_HOME`을 위처럼 export해야 함.

## 디자인 시스템 — "Kinetic Obsidian"

Google Stitch로 만든 디자인 명세를 기반으로 전체 UI를 리디자인함(2026-09-09).

- **폰트**: Inter(본문) + JetBrains Mono(숫자/지표) — `next/font/google`로 로드, `frontend/src/app/layout.tsx`
- **아이콘**: Material Symbols Outlined(리게이처 기반). `frontend/src/components/material-icon.tsx`의 `<MaterialIcon name="..." />`로 사용. lucide-react는 대부분 제거했지만 `BodyPartIcon`(부위별 커스텀 아이콘)은 의도적으로 유지
- **색상 토큰**: `frontend/src/app/globals.css`의 `@theme inline` 안에 정의된 Material Design 3 스타일 시맨틱 토큰 — `surface`, `surface-container`, `surface-container-lowest/low/high/highest`, `on-surface`, `on-surface-variant`, `primary`(`#ccff80`), `primary-container`(`#a3e635`), `on-primary-container`, `secondary`(`#4ae176`), `tertiary`(`#def1ff`), `error`(`#ffb4ab`) 등. 옛날 `bg-black`/`bg-zinc-*`/`bg-lime-400` 클래스는 전부 이 토큰으로 교체됨(단, `set-panel.tsx`는 스타일링 자체는 아직 옛 방식 — 기능만 수정했음, 필요시 리디자인 대상)
- **카드 스타일**: 글래스모피즘 — `rounded-2xl bg-white/[0.04] backdrop-blur-xl shadow-md` 패턴, 주요 요소에는 라임색 "kinetic glow" box-shadow

**리디자인 완료 화면**: 대시보드(`/`), 루틴(`/routine`), 캘린더(`/calendar`), 운동 도감(`/exercises`), 통계(`/stats`), 로그인(`/login`), 회원가입(`/signup`), AI 코치 위젯.
**아직 옛 스타일인 곳**: `SetPanel`(세트 기록 패널, `frontend/src/components/set-panel.tsx`) — 기능 로직은 최신이지만 시각 스타일은 리디자인 이전 상태.

**리디자인 시 지킨 원칙**(다음 화면 작업 시에도 동일하게 적용):
1. 기존 state/handler/API 호출은 100% 유지, 레이아웃/스타일만 교체
2. Stitch 목업의 가짜/미구현 지표(CNS Readiness, 심박수, RPE, ACWR, 팀 텔레메트리, PRO ATHLETE 뱃지, 가짜 후기 등)는 전부 제거하고 실제로 계산 가능한 데이터로 대체
3. Stitch가 제안한 기능이 백엔드에 이미 있는데 프론트가 안 쓰고 있었다면(예: 주간 네비게이션) 진짜 기능으로 구현
4. 한 화면씩 순서대로 진행 + 매번 `npm run build` && `npm run test`로 검증

## 최근 주요 기능

- **AI 운동 코치**: `backend/.../assistant/AssistantService.java` — Claude API(Tool Use, `anthropic-java` SDK) 기반. 유저의 실제 스트릭/운동 히스토리/회복 상태/부위 비중을 조회하는 4개 read-only 도구 보유. 질문 언어 그대로 답하도록 시스템 프롬프트 설정됨(하드코딩된 한국어 강제 없음). 대화 기록은 계정별 localStorage에 저장(`assistant-widget.tsx`). 우측 하단 플로팅 버튼(`smart_toy` 아이콘)
- **구글 로그인**: ID 토큰 방식(리다이렉트 없음), `AuthService.loginWithGoogle()`이 이메일 find-or-create. `email_verified` 검증 포함(보안 리뷰에서 추가). 버튼은 구글 기본 위젯이 아니라 **커스텀 디자인 버튼 위에 투명한 실제 구글 버튼을 오버레이**하는 방식(`google-signin-button.tsx`) — Stitch 목업과 똑같은 디자인을 구글 기본 테마로는 재현할 수 없어서 이렇게 처리함. "SSO" 뱃지는 실제와 안 맞아서 제거함
- **유산소 운동 시간 기록**(2026-09-09): 기존엔 모든 운동이 무게x횟수만 기록 가능했는데, `bodyPart === "CARDIO"`인 운동은 시간(분) 기준으로 기록하도록 전면 수정
  - DB: `workout_sets.duration_min` 컬럼 추가(V4 마이그레이션), `weight_kg`/`reps`는 nullable로 완화
  - 세트 하나는 `{weightKg, reps}` 또는 `{durationMin}` 중 하나만 채워짐(서로 배타적)
  - `RoutineService.exerciseHistory()`가 유산소면 "최고 무게/총 볼륨" 대신 "총 운동 시간"을 계산
  - `SetPanel`이 유산소면 시간(분) 입력 폼을, 아니면 무게/횟수 입력 폼을 보여줌
  - 통계 페이지 종목별 추이 섹션도 유산소 선택 시 시간 차트+진단 레일로 전환
  - 대시보드/루틴/캘린더의 "총 볼륨(kg)" 계산은 null-safe하게 처리되어 유산소 세트는 자연히 0으로 빠짐(의도된 동작 — 그 지표는 무게 훈련량 전용)

## 작업 규칙 (반드시 준수)

- **커밋 메시지는 일본어로 작성**(사용자 명시적 요청, 과거 세션부터 유지)
- 커밋 메시지 끝에 항상 추가:
  ```
  Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01GUjCMb1RioCHqZgwqBo6a2
  ```
- **브랜치 전략**: 작업은 `v1 → v2 → v3 → v4 → v5 ...` 순서로 새 브랜치를 만들어 진행. 작업 끝나면 해당 브랜치에 커밋 → push → `git push origin vN:main`으로 main도 같이 fast-forward → 다음 세션을 위해 `v(N+1)` 브랜치를 새로 만들어 push해둠
- 실제 데이터로 검증 불가능한 지표/기능은 만들지 않기(위 "리디자인 원칙" 참고) — 이 프로젝트 전체에 적용되는 철학
- 화면/기능 변경 후엔 항상 `npm run build`(frontend) / `./mvnw test`(backend, JAVA_HOME export 필수)로 검증
- Notion에도 개발 일지·기능 구현 방식·DB 설계서를 기록 중 — 큰 변경사항은 Notion에도 반영 요청받을 수 있음

## 아직 안 한 것 / 보류된 것

- AI 어시스턴트 rate-limiting (보안 리뷰에서 발견, 명시적으로 "보류하자"고 결정됨)
- 카카오/라인 소셜 로그인 (구글만 우선 구현, 나중에 추가 검토)
- 팀/그룹 기능 (대시보드에 더미 위젯만 존재, 실제 기능 없음)
- `SetPanel` 컴포넌트 시각 리디자인 (기능은 최신, 스타일만 구버전)

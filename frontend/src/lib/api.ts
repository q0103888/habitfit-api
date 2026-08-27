const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// 백엔드가 { "message": "..." } 형태로 보낸 에러를, 화면에서 구분해서 잡을 수 있게
// 전용 에러 타입으로 감쌈. 그냥 Error를 던지면 나중에 "이게 API 에러인지 다른 에러인지"
// 구분이 안 되는데, ApiError로 만들어두면 instanceof로 구분 가능
export class ApiError extends Error {}

// 모든 API 호출이 공통으로 거치는 내부 함수.
// <T>는 제네릭 — "호출하는 쪽에서 반환 타입을 지정할 수 있다"는 뜻
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // localStorage는 브라우저에만 있는 기능이라, 서버에서 렌더링될 때는 없을 수 있음.
  // typeof window !== "undefined"로 "지금 브라우저에서 실행 중인지" 먼저 확인
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options, // 호출하는 쪽에서 넘긴 method, body 등을 그대로 반영
    headers: {
      "Content-Type": "application/json",
      // 토큰이 있으면 Authorization 헤더에 자동으로 붙여줌.
      // 이걸 여기 한 곳에 모아둬서, 나중에 만들 보호된 API들은
      // 매번 토큰 붙이는 코드를 반복 안 써도 됨
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    // 실패 응답의 JSON을 파싱 시도. 혹시 body가 JSON이 아니면 빈 객체로 처리
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? "요청에 실패했습니다.");
  }

  // 204 No Content처럼 body가 없는 응답에서 res.json()을 부르면 파싱 에러가 남
  if (res.status === 204) return undefined as T;

  return res.json();
}

// 백엔드 AuthResponse 레코드와 모양을 맞춘 타입
export type AuthResponse = { token: string; email: string; firstName: string };

// 백엔드 SignupRequest 레코드와 모양을 맞춘 타입
export type SignupPayload = {
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  birthDate: string; // LocalDate는 JSON으로 오갈 때 "YYYY-MM-DD" 문자열이 됨
  nationality: string;
};

export type LoginPayload = { email: string; password: string };

export function signup(data: SignupPayload) {
  return request<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function login(data: LoginPayload) {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 루틴에 기록된 세트 하나 (예: 60kg x 10회)
export type RoutineSet = { id: number; setNumber: number; weightKg: number; reps: number };

// 백엔드 RoutineResponse 레코드와 모양을 맞춘 타입
export type Routine = {
  id: number;
  bodyPart: string;
  exerciseName: string;
  scheduledDate: string;
  done: boolean;
  fromTemplate: boolean;
  sets: RoutineSet[];
};

// 루틴 생성 요청 body — 백엔드 RoutineRequest 레코드와 모양을 맞춤
export type RoutinePayload = {
  bodyPart: string;
  exerciseName: string;
  scheduledDate: string;
};

// date를 안 주면 백엔드가 오늘 날짜 기준으로 조회
export function getRoutines(date?: string) {
  return request<Routine[]>(`/api/routines${date ? `?date=${date}` : ""}`);
}

// date가 속한 주(월~일) 전체 루틴 조회 — date를 안 주면 이번 주 기준
export function getWeekRoutines(date?: string) {
  return request<Routine[]>(`/api/routines/week${date ? `?date=${date}` : ""}`);
}

// 새 루틴 추가 (반복 템플릿과 무관한 1회성 루틴)
export function createRoutine(data: RoutinePayload) {
  return request<Routine>("/api/routines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 완료 체크 토글 (done true/false 뒤집기)
export function toggleRoutine(id: number) {
  return request<Routine>(`/api/routines/${id}/toggle`, { method: "PATCH" });
}

// 세트 기록 추가 (몇 kg x 몇 회) — 세트 목록이 갱신된 루틴 전체를 돌려받음
export function addSet(routineId: number, data: { weightKg: number; reps: number }) {
  return request<Routine>(`/api/routines/${routineId}/sets`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteSet(routineId: number, setId: number) {
  return request<Routine>(`/api/routines/${routineId}/sets/${setId}`, { method: "DELETE" });
}

// 루틴 삭제 — 템플릿에서 나온 루틴이면 서버가 그 날짜만 스킵 처리하고 지움
export function deleteRoutine(id: number) {
  return request<void>(`/api/routines/${id}`, { method: "DELETE" });
}

// 연속 달성일 조회 — 계산 로직은 백엔드 RoutineService.calculateStreak() 참고
export function getStreak() {
  return request<{ days: number }>("/api/routines/streak");
}

// 부위별 운동 카탈로그 — 루틴 추가 폼에서 자유 입력 대신 여기서 골라 쓰게 함
export type Exercise = { id: number; bodyPart: string; name: string };

export function getExercises() {
  return request<Exercise[]>("/api/exercises");
}

// 월요일 시작 — lib/constants.ts의 WEEKDAY_LABELS와 인덱스가 맞아야 함
export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

// 백엔드 RoutineTemplateResponse 레코드와 모양을 맞춘 타입 — "매주 O요일 = OO 운동" 반복 규칙
export type RoutineTemplate = {
  id: number;
  bodyPart: string;
  exerciseName: string;
  dayOfWeek: (typeof WEEKDAYS)[number];
};

// 반복 템플릿 생성 요청 body — 날짜가 아니라 요일(dayOfWeek)을 받음
export type RoutineTemplatePayload = {
  bodyPart: string;
  exerciseName: string;
  dayOfWeek: (typeof WEEKDAYS)[number];
};

// 내가 등록해둔 반복 규칙 전부 조회
export function getTemplates() {
  return request<RoutineTemplate[]>("/api/routine-templates");
}

// 새 반복 규칙 등록 ("매주 O요일 = 이 부위/운동")
export function createTemplate(data: RoutineTemplatePayload) {
  return request<RoutineTemplate>("/api/routine-templates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// 반복 규칙 삭제 — 오늘 이후 이미 생성된 인스턴스도 서버에서 같이 지워짐
export function deleteTemplate(id: number) {
  return request<void>(`/api/routine-templates/${id}`, { method: "DELETE" });
}

// 몸무게 기록 하나 — 하루에 한 건만 유지됨(같은 날 다시 기록하면 덮어씀)
export type BodyWeightLog = { id: number; recordedDate: string; weightKg: number };

// 전체 기록 조회 (날짜 오름차순, 나중에 통계 그래프에서 그대로 씀)
export function getBodyWeightLogs() {
  return request<BodyWeightLog[]>("/api/body-weight");
}

// 오늘 몸무게 기록/수정
export function recordBodyWeight(weightKg: number) {
  return request<BodyWeightLog>("/api/body-weight", {
    method: "POST",
    body: JSON.stringify({ weightKg }),
  });
}

// 통계 화면의 운동별 무게 추이 그래프용 — 하루(세션)당 최고 무게 + 총 볼륨(무게 x 횟수 합)
export type ExerciseHistoryPoint = {
  date: string;
  maxWeightKg: number;
  totalVolumeKg: number;
  totalSets: number;
};

export function getExerciseHistory(exerciseName: string) {
  return request<ExerciseHistoryPoint[]>(
    `/api/routines/history?exerciseName=${encodeURIComponent(exerciseName)}`,
  );
}

// 통계 화면의 부위별 비중 도넛차트용 — 최근 30일간 부위별 루틴 횟수
export type BodyPartSummaryPoint = { bodyPart: string; count: number };

export function getBodyPartSummary() {
  return request<BodyPartSummaryPoint[]>("/api/routines/summary");
}
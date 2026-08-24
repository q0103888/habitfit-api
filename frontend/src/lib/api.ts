const API_BASE = "http://localhost:8080";

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

// 백엔드 RoutineResponse 레코드와 모양을 맞춘 타입
export type Routine = {
  id: number;
  bodyPart: string;
  exerciseName: string;
  scheduledDate: string;
  done: boolean;
  fromTemplate: boolean;
};

export type RoutinePayload = {
  bodyPart: string;
  exerciseName: string;
  scheduledDate: string;
};

// date를 안 주면 백엔드가 오늘 날짜 기준으로 조회
export function getRoutines(date?: string) {
  return request<Routine[]>(`/api/routines${date ? `?date=${date}` : ""}`);
}

// date가 속한 주(일~토) 전체 루틴 조회 — date를 안 주면 이번 주 기준
export function getWeekRoutines(date?: string) {
  return request<Routine[]>(`/api/routines/week${date ? `?date=${date}` : ""}`);
}

export function createRoutine(data: RoutinePayload) {
  return request<Routine>("/api/routines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function toggleRoutine(id: number) {
  return request<Routine>(`/api/routines/${id}/toggle`, { method: "PATCH" });
}

export function deleteRoutine(id: number) {
  return request<void>(`/api/routines/${id}`, { method: "DELETE" });
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

export type RoutineTemplatePayload = {
  bodyPart: string;
  exerciseName: string;
  dayOfWeek: (typeof WEEKDAYS)[number];
};

export function getTemplates() {
  return request<RoutineTemplate[]>("/api/routine-templates");
}

export function createTemplate(data: RoutineTemplatePayload) {
  return request<RoutineTemplate>("/api/routine-templates", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteTemplate(id: number) {
  return request<void>(`/api/routine-templates/${id}`, { method: "DELETE" });
}
const API_BASE = "http://localhost:8080";

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message ?? "요청에 실패했습니다.");
  }

  return res.json();
}

export type AuthResponse = { token: string; email: string };

export type MeResponse = {
  email: string;
  lastName: string;
  firstName: string;
  birthDate: string;
  nationality: string;
};

export type SignupPayload = {
  email: string;
  password: string;
  lastName: string;
  firstName: string;
  birthDate: string;
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

export function fetchMe() {
  return request<MeResponse>("/api/auth/me");
}

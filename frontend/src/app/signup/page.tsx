"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup, ApiError, type SignupPayload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// DB 테이블 대신 여기 고정 배열로 관리 — ISO 국가 코드는 사실상 안 바뀌는 데이터라
// 프론트 코드 안에 하드코딩해도 충분함. 나중에 국가가 더 필요하면 그냥 이 배열에 추가하면 됨
const NATIONALITIES = [
  { code: "KR", label: "대한민국" },
  { code: "JP", label: "일본" },
  { code: "US", label: "미국" },
  { code: "CN", label: "중국" },
];

const initialForm: SignupPayload = {
  email: "",
  password: "",
  lastName: "",
  firstName: "",
  birthDate: "",
  nationality: NATIONALITIES[0].code, // 기본값을 목록 첫 번째로 미리 선택해둠
};

export default function SignupPage() {
  const [form, setForm] = useState<SignupPayload>(initialForm);
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인 입력값. 서버로 안 보내고 클라이언트에서만 비교
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // 입력창마다 onChange 함수를 따로 안 만들고, 필드 이름만 받으면
  // 그 필드를 업데이트하는 함수를 만들어서 돌려주는 "함수를 만드는 함수"
  function updateField(field: keyof SignupPayload) {
    return (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    // 백엔드로 보내기 전에 프론트에서 먼저 확인 — 서버까지 갈 필요도 없는 실수라
    // API 호출 전에 걸러내는 게 사용자 입장에서도 더 빠르게 피드백을 받음
    if (form.password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await signup(form);       // 백엔드 회원가입 API 호출
      await login(form.email, form.password); // 가입 성공했으니 바로 로그인 상태로 전환
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8"
      >
        <h1 className="text-xl font-bold">PeakFit 회원가입</h1>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">성</label>
            <input
              required
              value={form.lastName}
              onChange={updateField("lastName")}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">이름</label>
            <input
              required
              value={form.firstName}
              onChange={updateField("firstName")}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium text-gray-700">이메일</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={updateField("email")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">비밀번호</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={updateField("password")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">비밀번호 확인</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">생년월일</label>
        <input
          type="date"
          required
          value={form.birthDate}
          onChange={updateField("birthDate")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">국적</label>
        <select
          required
          value={form.nationality}
          onChange={updateField("nationality")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
        >
          {NATIONALITIES.map((n) => (
            <option key={n.code} value={n.code}>
              {n.label}
            </option>
          ))}
        </select>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isSubmitting ? "가입 중..." : "회원가입"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있나요? <Link href="/login" className="font-semibold text-emerald-700">로그인</Link>
        </p>
      </form>
    </div>
  );
}
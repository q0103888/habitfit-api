"use client";
// 폼 입력값(useState), 제출 처리(onSubmit) 같은 상호작용이 필요해서 클라이언트 컴포넌트로

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  // 입력창 하나당 state 하나. 사용자가 타이핑할 때마다 이 값들이 갱신됨
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");         // 실패 메시지 보여줄 자리
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 클릭 방지용

  const { login } = useAuth();   // 2단계에서 만든 Context에서 login 함수 꺼내옴
  const router = useRouter();     // 페이지 이동시킬 때 씀

  async function handleSubmit(e: FormEvent) {
    e.preventDefault(); // 폼 기본 동작(새로고침)을 막음 — 이게 없으면 페이지가 리로드돼버림
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);   // AuthContext의 login() 호출 → 내부에서 백엔드 API 호출
      router.push("/");               // 성공하면 대시보드로 이동
    } catch (err) {
      // ApiError면 백엔드가 보낸 진짜 실패 이유를 보여줌, 아니면 일반 메시지
      setError(err instanceof ApiError ? err.message : "로그인에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8"
      >
        <h1 className="text-xl font-bold">PeakFit 로그인</h1>

        <label className="mt-6 block text-sm font-medium text-gray-700">이메일</label>
        <input
          type="email"
          required
          value={email}                                   // ① state 값을 그대로 화면에 반영
          onChange={(e) => setEmail(e.target.value)}       // ② 타이핑할 때마다 state 갱신
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">비밀번호</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-900"
        />

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isSubmitting ? "로그인 중..." : "로그인"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          계정이 없나요? <Link href="/signup" className="font-semibold text-emerald-700">회원가입</Link>
        </p>
      </form>
    </div>
  );
}
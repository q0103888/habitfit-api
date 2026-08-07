"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login as loginApi, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await loginApi({ email, password });
      await login(res.token);
      router.push("/");
    } catch (err) {
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
        <p className="mt-1 text-sm text-gray-500">
          운동 루틴을 이어서 기록해보세요.
        </p>

        <label className="mt-6 block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
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
          계정이 없나요?{" "}
          <Link href="/signup" className="font-semibold text-emerald-700">
            회원가입
          </Link>
        </p>
      </form>
    </div>
  );
}

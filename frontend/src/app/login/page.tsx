"use client";
// 폼 입력값(useState), 제출 처리(onSubmit) 같은 상호작용이 필요해서 클라이언트 컴포넌트로

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";

export default function LoginPage() {
  // 입력창 하나당 state 하나. 사용자가 타이핑할 때마다 이 값들이 갱신됨
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");         // 실패 메시지 보여줄 자리
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 클릭 방지용

  const { login } = useAuth();   // 2단계에서 만든 Context에서 login 함수 꺼내옴
  const { t } = useLanguage();
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
      setError(err instanceof ApiError ? err.message : t("auth.loginFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
      >
        <Image src="/logo.png" alt={t("common.logoAlt")} width={48} height={48} className="rounded-xl" />
        <h1 className="mt-4 text-xl font-bold text-white">{t("auth.loginTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-400">{t("auth.loginSubtitle")}</p>

        <label className="mt-6 block text-sm font-medium text-zinc-300">{t("auth.email")}</label>
        <input
          type="email"
          required
          value={email}                                   // ① state 값을 그대로 화면에 반영
          onChange={(e) => setEmail(e.target.value)}       // ② 타이핑할 때마다 state 갱신
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />

        <label className="mt-4 block text-sm font-medium text-zinc-300">{t("auth.password")}</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
        />

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-lime-400 py-2.5 text-sm font-semibold text-black shadow-[0_0_25px_-6px_rgba(163,230,53,0.7)] hover:bg-lime-300 disabled:opacity-50"
        >
          {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {t("auth.noAccount")}{" "}
          <Link href="/signup" className="font-semibold text-lime-400">
            {t("auth.signup")}
          </Link>
        </p>
      </form>
    </div>
  );
}

"use client";
// 폼 입력값(useState), 제출 처리(onSubmit) 같은 상호작용이 필요해서 클라이언트 컴포넌트로

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { AuthLayout } from "@/components/auth-layout";
import { MaterialIcon } from "@/components/material-icon";

export default function LoginPage() {
  // 입력창 하나당 state 하나. 사용자가 타이핑할 때마다 이 값들이 갱신됨
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");         // 실패 메시지 보여줄 자리
  const [isSubmitting, setIsSubmitting] = useState(false); // 중복 클릭 방지용

  const { login, loginWithGoogle } = useAuth();   // 2단계에서 만든 Context에서 login 함수 꺼내옴
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

  async function handleGoogleToken(idToken: string) {
    setError("");
    try {
      await loginWithGoogle(idToken);
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.googleLoginFailed"));
    }
  }

  return (
    <AuthLayout mode="login" title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")}>
      <GoogleSignInButton onToken={handleGoogleToken} />

      <div className="my-5 flex items-center gap-3 text-xs text-on-surface-variant">
        <div className="h-px flex-1 bg-white/[0.08]" />
        {t("auth.orContinueWith")}
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-on-surface-variant">{t("auth.email")}</label>
          <input
            type="email"
            required
            value={email}                                   // ① state 값을 그대로 화면에 반영
            onChange={(e) => setEmail(e.target.value)}       // ② 타이핑할 때마다 state 갱신
            className="mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant">{t("auth.password")}</label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-black/30 px-3.5 py-2.5 pr-10 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
            >
              <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-[18px]" />
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary-container py-3 text-xs font-bold uppercase tracking-wide text-on-primary-container shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
        </button>
      </form>
    </AuthLayout>
  );
}

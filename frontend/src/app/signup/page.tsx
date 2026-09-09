"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signup, ApiError, type SignupPayload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, type Key } from "@/lib/i18n";
import { GoogleSignInButton } from "@/components/google-signin-button";
import { AuthLayout } from "@/components/auth-layout";
import { MaterialIcon } from "@/components/material-icon";

// DB 테이블 대신 여기 고정 배열로 관리 — ISO 국가 코드는 사실상 안 바뀌는 데이터라
// 프론트 코드 안에 하드코딩해도 충분함. 나중에 국가가 더 필요하면 그냥 이 배열에 추가하면 됨.
// 화면 라벨은 언어별로 다르므로 i18n 딕셔너리의 nationality.* 키에서 가져옴
const NATIONALITIES: { code: string; labelKey: Key }[] = [
  { code: "KR", labelKey: "nationality.KR" },
  { code: "JP", labelKey: "nationality.JP" },
  { code: "US", labelKey: "nationality.US" },
  { code: "CN", labelKey: "nationality.CN" },
];

const initialForm: SignupPayload = {
  email: "",
  password: "",
  lastName: "",
  firstName: "",
  birthDate: "",
  nationality: NATIONALITIES[0].code, // 기본값을 목록 첫 번째로 미리 선택해둠
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/[0.08] bg-black/30 px-3.5 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary-container focus:outline-none";

export default function SignupPage() {
  const [form, setForm] = useState<SignupPayload>(initialForm);
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인 입력값. 서버로 안 보내고 클라이언트에서만 비교
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const { t } = useLanguage();
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
      setError(t("auth.passwordMismatch"));
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(form);                      // 백엔드 회원가입 API 호출
      await login(form.email, form.password); // 가입 성공했으니 바로 로그인 상태로 전환
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.signupFailed"));
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
    <AuthLayout mode="signup" title={t("auth.signupTitle")} subtitle={t("auth.heroSubtitle")}>
      <GoogleSignInButton onToken={handleGoogleToken} />

      <div className="my-5 flex items-center gap-3 text-xs text-on-surface-variant">
        <div className="h-px flex-1 bg-white/[0.08]" />
        {t("auth.orContinueWith")}
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-on-surface-variant">{t("auth.lastName")}</label>
            <input required value={form.lastName} onChange={updateField("lastName")} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-on-surface-variant">{t("auth.firstName")}</label>
            <input required value={form.firstName} onChange={updateField("firstName")} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant">{t("auth.email")}</label>
          <input type="email" required value={form.email} onChange={updateField("email")} className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant">{t("auth.password")}</label>
          <div className="relative mt-1.5">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={updateField("password")}
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

        <div>
          <label className="block text-xs font-medium text-on-surface-variant">{t("auth.confirmPassword")}</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant">{t("auth.birthDate")}</label>
          <input type="date" required value={form.birthDate} onChange={updateField("birthDate")} className={inputClass} />
        </div>

        <div>
          <label className="block text-xs font-medium text-on-surface-variant">{t("auth.nationality")}</label>
          <select required value={form.nationality} onChange={updateField("nationality")} className={inputClass}>
            {NATIONALITIES.map((n) => (
              <option key={n.code} value={n.code} className="bg-surface-container">
                {t(n.labelKey)}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary-container py-3 text-xs font-bold uppercase tracking-wide text-on-primary-container shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all hover:brightness-110 disabled:opacity-50"
        >
          {isSubmitting ? t("auth.signingUp") : t("auth.signup")}
        </button>
      </form>
    </AuthLayout>
  );
}

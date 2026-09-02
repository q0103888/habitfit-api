"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signup, ApiError, type SignupPayload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, type Key } from "@/lib/i18n";

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
  "mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-600";

export default function SignupPage() {
  const [form, setForm] = useState<SignupPayload>(initialForm);
  const [confirmPassword, setConfirmPassword] = useState(""); // 비밀번호 확인 입력값. 서버로 안 보내고 클라이언트에서만 비교
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
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
      const res = await signup(form);       // 백엔드 회원가입 API 호출
      await login(form.email, form.password); // 가입 성공했으니 바로 로그인 상태로 전환
      router.push("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.signupFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl"
      >
        <Image src="/logo.png" alt={t("common.logoAlt")} width={48} height={48} className="rounded-xl" />
        <h1 className="mt-4 text-xl font-bold text-white">{t("auth.signupTitle")}</h1>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-300">{t("auth.lastName")}</label>
            <input
              required
              value={form.lastName}
              onChange={updateField("lastName")}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300">{t("auth.firstName")}</label>
            <input
              required
              value={form.firstName}
              onChange={updateField("firstName")}
              className={inputClass}
            />
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium text-zinc-300">{t("auth.email")}</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={updateField("email")}
          className={inputClass}
        />

        <label className="mt-4 block text-sm font-medium text-zinc-300">{t("auth.password")}</label>
        <input
          type="password"
          required
          value={form.password}
          onChange={updateField("password")}
          className={inputClass}
        />

        <label className="mt-4 block text-sm font-medium text-zinc-300">{t("auth.confirmPassword")}</label>
        <input
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass}
        />

        <label className="mt-4 block text-sm font-medium text-zinc-300">{t("auth.birthDate")}</label>
        <input
          type="date"
          required
          value={form.birthDate}
          onChange={updateField("birthDate")}
          className={inputClass}
        />

        <label className="mt-4 block text-sm font-medium text-zinc-300">{t("auth.nationality")}</label>
        <select
          required
          value={form.nationality}
          onChange={updateField("nationality")}
          className={inputClass}
        >
          {NATIONALITIES.map((n) => (
            <option key={n.code} value={n.code} className="bg-zinc-900">
              {t(n.labelKey)}
            </option>
          ))}
        </select>

        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-lime-400 py-2.5 text-sm font-semibold text-black shadow-[0_0_25px_-6px_rgba(163,230,53,0.7)] hover:bg-lime-300 disabled:opacity-50"
        >
          {isSubmitting ? t("auth.signingUp") : t("auth.signup")}
        </button>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-semibold text-lime-400">
            {t("auth.login")}
          </Link>
        </p>
      </form>
    </div>
  );
}

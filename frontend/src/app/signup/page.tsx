"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signup as signupApi, ApiError, type SignupPayload } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const initialForm: SignupPayload = {
  email: "",
  password: "",
  lastName: "",
  firstName: "",
  birthDate: "",
  nationality: "",
};

export default function SignupPage() {
  const [form, setForm] = useState<SignupPayload>(initialForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  function updateField(field: keyof SignupPayload) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await signupApi(form);
      await login(res.token);
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
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">이름</label>
            <input
              required
              value={form.firstName}
              onChange={updateField("firstName")}
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          이메일
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={updateField("email")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">
          비밀번호
        </label>
        <input
          type="password"
          required
          value={form.password}
          onChange={updateField("password")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">
          생년월일
        </label>
        <input
          type="date"
          required
          value={form.birthDate}
          onChange={updateField("birthDate")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />

        <label className="mt-4 block text-sm font-medium text-gray-700">
          국적
        </label>
        <input
          required
          placeholder="예: KR"
          value={form.nationality}
          onChange={updateField("nationality")}
          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {isSubmitting ? "가입 중..." : "회원가입"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-500">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-semibold text-emerald-700">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}

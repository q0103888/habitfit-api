"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { useLanguage, type Key, type Locale } from "@/lib/i18n";

const FEATURES: { icon: string; labelKey: Key }[] = [
  { icon: "fitness_center", labelKey: "auth.featureRoutine" },
  { icon: "insights", labelKey: "auth.featureStats" },
  { icon: "smart_toy", labelKey: "auth.featureAi" },
];

// 로그인/회원가입 페이지가 공유하는 바깥 껍데기 — 헤더(로고+언어토글), 좌측 소개 패널,
// 우측 글래스 카드(탭 전환 + 제목/부제목)까지 여기서 그리고, 폼 내용만 children으로 받음
export function AuthLayout({
  mode,
  title,
  subtitle,
  children,
}: {
  mode: "login" | "signup";
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const { locale, setLocale, t } = useLanguage();

  return (
    <div className="relative flex min-h-screen flex-col bg-surface-container-lowest text-on-surface">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_50%_30%,rgba(163,230,53,0.12),transparent_60%)]" />

      <header className="relative z-10 flex items-center justify-between border-b border-white/[0.05] px-6 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt={t("common.logoAlt")} width={32} height={32} className="rounded-xl" />
          <span className="text-base font-extrabold uppercase tracking-wider text-on-surface">PeakFit</span>
        </Link>
        <div className="flex items-center gap-0.5 rounded-full bg-surface-container-high p-0.5">
          {(["ja", "ko"] as Locale[]).map((l) => (
            <button
              key={l}
              onClick={() => setLocale(l)}
              className={`rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                locale === l ? "bg-surface-container-highest text-primary" : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {l === "ja" ? "JP" : "KR"}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="grid w-full max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="hidden flex-col gap-8 lg:col-span-6 lg:flex">
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-on-surface">
                {t("auth.heroTitle")}
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">{t("auth.heroSubtitle")}</p>
            </div>
            <div className="flex flex-col gap-3">
              {FEATURES.map((f) => (
                <div
                  key={f.labelKey}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-container/15 text-primary-container">
                    <MaterialIcon name={f.icon} className="text-[20px]" />
                  </span>
                  <span className="text-sm text-on-surface">{t(f.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto w-full max-w-sm lg:col-span-6">
            <div className="relative rounded-3xl border border-white/[0.08] bg-surface-container-lowest/75 p-7 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_40px_-10px_rgba(163,230,53,0.08)] backdrop-blur-2xl sm:p-8">
              <div className="absolute -top-px left-1/2 h-1 w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary-container to-transparent" />

              <div className="mb-6 flex rounded-xl border border-white/[0.06] bg-black/30 p-1">
                <Link
                  href="/login"
                  className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-all ${
                    mode === "login"
                      ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("auth.login")}
                </Link>
                <Link
                  href="/signup"
                  className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition-all ${
                    mode === "signup"
                      ? "bg-primary-container text-on-primary-container shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  {t("auth.signup")}
                </Link>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight text-on-surface">{title}</h2>
                <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

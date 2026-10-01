"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/material-icon";
import { WorkoutIllustration } from "@/components/workout-illustration";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, type Locale } from "@/lib/i18n";

const TIP_KEYS = ["tip.1", "tip.2", "tip.3", "tip.4", "tip.5", "tip.6", "tip.7", "tip.8", "tip.9", "tip.10"] as const;

const TIP_ROTATE_MS = 30_000; // 30초마다 랜덤 교체

// href="#"인 항목(팀)은 아직 실제 페이지가 없는 자리만 잡아둔 메뉴
const navItems = [
  { labelKey: "nav.dashboard", icon: "grid_view", href: "/" },
  { labelKey: "nav.routine", icon: "fitness_center", href: "/routine" },
  { labelKey: "nav.aiRoutine", icon: "auto_awesome", href: "/routine/ai-generate" },
  { labelKey: "nav.exercises", icon: "menu_book", href: "/exercises" },
  { labelKey: "nav.calendar", icon: "calendar_today", href: "/calendar" },
  { labelKey: "nav.stats", icon: "insights", href: "/stats" },
  { labelKey: "nav.team", icon: "groups", href: "#" },
] as const;

// 아직 클릭해도 동작 없는 장식용 메뉴 (설정/도움말)
const generalItems = [
  { labelKey: "nav.settings", icon: "settings" },
  { labelKey: "nav.help", icon: "help" },
] as const;

// 대시보드/루틴 페이지가 공용으로 쓰는 사이드바. pathname으로 현재 메뉴를 활성 표시함.
// lg 미만(모바일/태블릿)에서는 사이드바 자체가 안 보이므로, 좌측 상단에 떠 있는
// 메뉴 버튼 + 슬라이드인 드로어로 동일한 내비게이션을 제공함
export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();
  const [tipKey, setTipKey] = useState(() => TIP_KEYS[Math.floor(Math.random() * TIP_KEYS.length)]);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setTipKey((prev) => {
        const rest = TIP_KEYS.filter((k) => k !== prev);
        return rest[Math.floor(Math.random() * rest.length)];
      });
    }, TIP_ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  // 페이지 이동하면 모바일 드로어는 자동으로 닫음
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  // 데스크톱 사이드바와 모바일 드로어가 그대로 공유하는 내용
  const navContent = (
    <>
      <div className="flex items-center justify-between px-1">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt={t("common.logoAlt")} width={32} height={32} className="rounded-xl" />
          <span className="font-sans text-base font-bold uppercase tracking-tight text-on-surface">PeakFit</span>
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
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        {navItems.map(({ labelKey, icon, href }) => (
          <Link
            key={labelKey}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
              pathname === href
                ? "bg-primary-container font-bold text-on-primary-container shadow-[0_0_20px_rgba(163,230,53,0.35)]"
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            }`}
          >
            <MaterialIcon name={icon} className="text-[20px]" />
            {t(labelKey)}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
        >
          <MaterialIcon name="logout" className="text-[20px]" />
          {t("nav.logout")}
        </button>
      </nav>

      <nav className="mt-4 flex flex-col gap-1 border-t border-white/[0.08] pt-4">
        {generalItems.map(({ labelKey, icon }) => (
          <button
            key={labelKey}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface"
          >
            <MaterialIcon name={icon} className="text-[20px]" />
            {t(labelKey)}
          </button>
        ))}
      </nav>

      <div className="mt-auto shrink-0 rounded-xl bg-surface-container/60 p-4 shadow-[0_0_24px_-4px_rgba(163,230,53,0.15)] backdrop-blur-xl">
        <WorkoutIllustration className="mb-2 h-9 w-9 text-primary-container" />
        <p className="font-badge-label text-[11px] font-bold uppercase tracking-wider text-primary-container">
          {t("nav.tipOfDay")}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">{t(tipKey)}</p>
      </div>
    </>
  );

  return (
    <>
      {/* 데스크톱 사이드바 (lg 이상에서만 보임) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto bg-surface-container-lowest/80 px-5 py-5 shadow-[0_1px_8px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:flex">
        {navContent}
      </aside>

      {/* 모바일 메뉴 버튼 (lg 미만에서만 보임) — 사이드바가 안 보이는 화면에서 화면 이동 수단 */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label={t("nav.menu")}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface shadow-[0_4px_16px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:hidden"
      >
        <MaterialIcon name="menu" className="text-[22px]" />
      </button>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col overflow-y-auto bg-surface-container-lowest px-5 py-5 shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

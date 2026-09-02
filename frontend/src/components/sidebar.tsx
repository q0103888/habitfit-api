"use client";

import {
  LayoutDashboard,
  Dumbbell,
  CalendarDays,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkoutIllustration } from "@/components/workout-illustration";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, type Locale } from "@/lib/i18n";

const TIP_KEYS = ["tip.1", "tip.2", "tip.3", "tip.4", "tip.5", "tip.6", "tip.7", "tip.8", "tip.9", "tip.10"] as const;

const TIP_ROTATE_MS = 30_000; // 30초마다 랜덤 교체

// href="#"인 항목(캘린더/팀)은 아직 실제 페이지가 없는 자리만 잡아둔 메뉴
const navItems = [
  { labelKey: "nav.dashboard", icon: LayoutDashboard, href: "/" },
  { labelKey: "nav.routine", icon: Dumbbell, href: "/routine" },
  { labelKey: "nav.calendar", icon: CalendarDays, href: "/calendar" },
  { labelKey: "nav.stats", icon: BarChart3, href: "/stats" },
  { labelKey: "nav.team", icon: Users, href: "#" },
] as const;

// 아직 클릭해도 동작 없는 장식용 메뉴 (설정/도움말)
const generalItems = [
  { labelKey: "nav.settings", icon: Settings },
  { labelKey: "nav.help", icon: HelpCircle },
] as const;

// 대시보드/루틴 페이지가 공용으로 쓰는 사이드바. pathname으로 현재 메뉴를 활성 표시함
export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { locale, setLocale, t } = useLanguage();
  const router = useRouter();
  const [tipKey, setTipKey] = useState(() => TIP_KEYS[Math.floor(Math.random() * TIP_KEYS.length)]);

  useEffect(() => {
    const id = setInterval(() => {
      setTipKey((prev) => {
        const rest = TIP_KEYS.filter((k) => k !== prev);
        return rest[Math.floor(Math.random() * rest.length)];
      });
    }, TIP_ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-white/10 bg-zinc-950/60 px-5 py-5 backdrop-blur-xl lg:flex">
      <Link href="/" className="flex items-center gap-2 px-1">
        <Image
          src="/logo.png"
          alt={t("common.logoAlt")}
          width={36}
          height={36}
          className="rounded-xl"
        />
        <span className="text-lg font-bold tracking-tight text-white">PeakFit</span>
      </Link>

      <div className="mt-4 flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-xs font-semibold">
        {(["ja", "ko"] as Locale[]).map((l) => (
          <button
            key={l}
            onClick={() => setLocale(l)}
            className={`flex-1 rounded-full py-1.5 transition-colors ${
              locale === l ? "bg-lime-400 text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {l === "ja" ? "日本語" : "한국어"}
          </button>
        ))}
      </div>

      <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("nav.menu")}
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {navItems.map(({ labelKey, icon: Icon, href }) => (
          <Link
            key={labelKey}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === href
                ? "bg-lime-400 text-black shadow-[0_0_20px_-4px_rgba(163,230,53,0.6)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {t(labelKey)}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          {t("nav.logout")}
        </button>
      </nav>

      <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {t("nav.general")}
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {generalItems.map(({ labelKey, icon: Icon }) => (
          <button
            key={labelKey}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Icon size={18} />
            {t(labelKey)}
          </button>
        ))}
      </nav>

      <div className="mt-auto shrink-0 rounded-2xl border border-lime-400/20 bg-gradient-to-br from-zinc-900 to-black p-4">
        <WorkoutIllustration className="mb-2 h-10 w-10 text-lime-400" />
        <p className="text-sm font-semibold text-white">{t("nav.tipOfDay")}</p>
        <p className="mt-1 text-xs leading-snug text-zinc-400">{t(tipKey)}</p>
      </div>
    </aside>
  );
}

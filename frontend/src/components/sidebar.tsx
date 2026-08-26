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

const TIPS = [
  "운동 전 5분 스트레칭으로 부상을 예방하세요.",
  "운동 후 30분 이내 단백질을 섭취하면 회복이 빨라져요.",
  "물은 운동 중에도 조금씩 자주 마시는 게 좋아요.",
  "같은 부위는 48시간 정도 쉬어야 근육이 회복돼요.",
  "무게보다 정확한 자세가 부상 예방에 더 중요해요.",
  "숙면은 근성장에 운동만큼 중요해요.",
  "웜업 세트로 시작하면 본세트에서 부상 위험이 줄어요.",
  "호흡은 힘을 줄 때 내쉬는 게 기본이에요.",
  "루틴은 꾸준함이 강도보다 중요해요.",
  "가벼운 유산소로 시작하면 관절 부담이 줄어요.",
];

const TIP_ROTATE_MS = 30_000; // 30초마다 랜덤 교체

// href="#"인 항목(캘린더/팀)은 아직 실제 페이지가 없는 자리만 잡아둔 메뉴
const navItems = [
  { label: "대시보드", icon: LayoutDashboard, href: "/" },
  { label: "루틴", icon: Dumbbell, href: "/routine" },
  { label: "캘린더", icon: CalendarDays, href: "#" },
  { label: "통계", icon: BarChart3, href: "/stats" },
  { label: "팀", icon: Users, href: "#" },
];

// 아직 클릭해도 동작 없는 장식용 메뉴 (설정/도움말)
const generalItems = [
  { label: "설정", icon: Settings },
  { label: "도움말", icon: HelpCircle },
];

// 대시보드/루틴 페이지가 공용으로 쓰는 사이드바. pathname으로 현재 메뉴를 활성 표시함
export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [tip, setTip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    const id = setInterval(() => {
      setTip((prev) => {
        const rest = TIPS.filter((t) => t !== prev);
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
          alt="PeakFit 로고"
          width={36}
          height={36}
          className="rounded-xl"
        />
        <span className="text-lg font-bold tracking-tight text-white">PeakFit</span>
      </Link>

      <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        메뉴
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {navItems.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              pathname === href
                ? "bg-lime-400 text-black shadow-[0_0_20px_-4px_rgba(163,230,53,0.6)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </nav>

      <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        일반
      </p>
      <nav className="mt-2 flex flex-col gap-1">
        {generalItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="mt-auto shrink-0 rounded-2xl border border-lime-400/20 bg-gradient-to-br from-zinc-900 to-black p-4">
        <WorkoutIllustration className="mb-2 h-10 w-10 text-lime-400" />
        <p className="text-sm font-semibold text-white">오늘의 팁</p>
        <p className="mt-1 text-xs leading-snug text-zinc-400">{tip}</p>
      </div>
    </aside>
  );
}

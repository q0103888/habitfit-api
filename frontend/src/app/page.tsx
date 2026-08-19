"use client"; // 파일 맨 첫 줄에 추가

import {
  Bell,
  Search,
  Plus,
  LayoutDashboard,
  Dumbbell,
  CalendarDays,
  BarChart3,
  Users,
  Settings,
  HelpCircle,
  LogOut,
  Flame,
  TrendingUp,
  CheckCircle2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { WorkoutIllustration } from "@/components/workout-illustration";
import { useRouter } from "next/navigation";
import { RequireAuth } from "@/components/require-auth";
import { useAuth } from "@/lib/auth-context";


const navItems = [
  { label: "대시보드", icon: LayoutDashboard, active: true },
  { label: "루틴", icon: Dumbbell },
  { label: "캘린더", icon: CalendarDays },
  { label: "통계", icon: BarChart3 },
  { label: "팀", icon: Users },
];

const generalItems = [
  { label: "설정", icon: Settings },
  { label: "도움말", icon: HelpCircle },
];

const stats = [
  { label: "이번 주 달성률", value: "74%", icon: TrendingUp, highlight: true },
  { label: "연속 달성일", value: "12일", icon: Flame },
  { label: "진행 중인 팀 루틴", value: "3개", icon: Users },
  { label: "오늘 완료", value: "2 / 4", icon: CheckCircle2 },
];

const weeklyRecord = [
  { day: "일", pct: 0 },
  { day: "월", pct: 80 },
  { day: "화", pct: 100 },
  { day: "수", pct: 45, isToday: true },
  { day: "목", pct: 0 },
  { day: "금", pct: 0 },
  { day: "토", pct: 0 },
];

const todayRoutine = [
  { part: "가슴", exercise: "벤치프레스", detail: "4세트 x 10회", done: true },
  { part: "등", exercise: "랫풀다운", detail: "3세트 x 12회", done: true },
  { part: "팔", exercise: "덤벨컬", detail: "3세트 x 15회", done: false },
  {
    part: "어깨",
    exercise: "사이드 레터럴 레이즈",
    detail: "3세트 x 12회",
    done: false,
  },
];

const teamMembers = [
  { name: "박서준", task: "가슴 루틴", status: "완료" as const },
  { name: "김하늘", task: "하체 루틴", status: "진행중" as const },
  { name: "이도현", task: "등 루틴", status: "미완료" as const },
  { name: "정유진", task: "어깨 루틴", status: "완료" as const },
];

const avatarColors = [
  "bg-emerald-100 text-emerald-800",
  "bg-amber-100 text-amber-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-800",
];

const statusStyles: Record<string, string> = {
  완료: "bg-emerald-100 text-emerald-700",
  진행중: "bg-amber-100 text-amber-700",
  미완료: "bg-gray-100 text-gray-500",
};

const weeklyGoalPct = 74;

function DayBar({
  day,
  pct,
  isToday,
}: {
  day: string;
  pct: number;
  isToday?: boolean;
}) {
  const filled = pct > 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-32 w-8 overflow-hidden rounded-full bg-gray-100">
        {filled ? (
          <div
            className={`absolute bottom-0 left-0 right-0 rounded-full ${
              isToday ? "bg-emerald-800" : "bg-emerald-400"
            }`}
            style={{ height: `${Math.max(pct, 10)}%` }}
          />
        ) : (
          <div
            className="absolute inset-0 rounded-full opacity-70"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, #d1d5db 0px, #d1d5db 3px, transparent 3px, transparent 7px)",
            }}
          />
        )}
      </div>
      <span
        className={`text-xs ${
          isToday ? "font-semibold text-emerald-800" : "text-gray-400"
        }`}
      >
        {day}
      </span>
    </div>
  );
}

export default function Home() {
  return (
    <RequireAuth>
      <Dashboard />
    </RequireAuth>
  );
}

// Home() 안에 중첩해서 정의하면 Home이 리렌더링될 때마다 Dashboard가
// "새로운 컴포넌트"로 취급돼서 매번 다시 마운트됨(깜빡임/상태 초기화 원인).
// 그래서 같은 파일이지만 Home과는 별개의(형제) 함수로 분리해서 정의함
function Dashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
      <div className="flex min-h-screen w-full bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white px-5 py-5 lg:flex">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
            <Dumbbell size={18} />
          </div>
          <span className="text-lg font-bold tracking-tight">PeakFit</span>
        </div>

        <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          메뉴
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          {navItems.map(({ label, icon: Icon, active }) => (
            <button
              key={label}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-emerald-700 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            <LogOut size={18} />
            로그아웃
          </button>
        </nav>

        <p className="mt-6 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          일반
        </p>
        <nav className="mt-2 flex flex-col gap-1">
          {generalItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="mt-auto shrink-0 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-4 text-white">
          <WorkoutIllustration className="mb-2 h-10 w-10 text-emerald-200" />
          <p className="text-sm font-semibold">오늘의 팁</p>
          <p className="mt-1 text-xs leading-snug text-emerald-100">
            운동 전 5분 스트레칭으로 부상을 예방하세요.
          </p>
        </div>
      </aside>

      {/* Main column */}
      <div className="min-w-0 flex-1">
        {/* Top bar */}
        <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-6 py-4 lg:px-8">
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-400">
            <Search size={16} />
            <span>운동 또는 루틴 검색</span>
          </div>
          <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <Bell size={18} />
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
          <div className="flex items-center gap-3">
            {/* 아바타 원 안에는 이니셜(이름 첫 글자)만 — 문장이 들어가면 40x40px 원을 넘침 */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-800">
              {user?.firstName?.[0]}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-tight">{user?.firstName}님</p>
            </div>
          </div>
        </header>

        <main className="space-y-6 p-6 lg:p-8">
          {/* Header row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
              <p className="mt-1 text-sm text-gray-500">
                오늘도 루틴을 확인하고 꾸준히 실천해보세요.
              </p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">
                <Plus size={16} />
                루틴 추가
              </button>
              <button className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <UserPlus size={16} />
                팀원 초대
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, highlight }) => (
              <div
                key={label}
                className={`rounded-2xl p-5 ${
                  highlight
                    ? "bg-emerald-800 text-white"
                    : "border border-gray-200 bg-white text-gray-900"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${
                      highlight ? "text-emerald-100" : "text-gray-500"
                    }`}
                  >
                    {label}
                  </span>
                  <Icon
                    size={18}
                    className={highlight ? "text-emerald-200" : "text-emerald-700"}
                  />
                </div>
                <p className="mt-3 text-3xl font-bold">{value}</p>
              </div>
            ))}
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold">이번 주 운동 기록</h2>
              <div className="mt-6 flex justify-between">
                {weeklyRecord.map((d) => (
                  <DayBar key={d.day} {...d} />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold">오늘의 리마인더</h2>
              <p className="mt-4 text-lg font-semibold leading-snug">
                저녁 8시, 하체 루틴
              </p>
              <p className="mt-1 text-sm text-gray-500">시간: 20:00 - 20:45</p>
              <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white hover:bg-emerald-800">
                <Dumbbell size={16} />
                루틴 시작하기
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">오늘의 루틴</h2>
                <button className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50">
                  <Plus size={14} />
                </button>
              </div>
              <ul className="mt-4 space-y-3">
                {todayRoutine.map((item) => (
                  <li
                    key={item.exercise}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {item.part}
                      </span>
                      <div>
                        <p className="text-sm font-medium leading-tight">
                          {item.exercise}
                        </p>
                        <p className="text-xs text-gray-400">{item.detail}</p>
                      </div>
                    </div>
                    <CheckCircle2
                      size={20}
                      className={item.done ? "text-emerald-600" : "text-gray-200"}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">팀 콜라보레이션</h2>
                <button className="flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                  <UserPlus size={14} />
                  멤버 추가
                </button>
              </div>
              <ul className="mt-4 space-y-4">
                {teamMembers.map((member, i) => (
                  <li
                    key={member.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                          avatarColors[i % avatarColors.length]
                        }`}
                      >
                        {member.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-400">{member.task}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[member.status]}`}
                      >
                        {member.status}
                      </span>
                      <button className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:bg-gray-50">
                        <MessageCircle size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="text-base font-semibold">주간 목표 달성률</h2>
              <div className="relative mx-auto mt-6 h-36 w-36">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(#065f46 0% ${weeklyGoalPct}%, #d1fae5 ${weeklyGoalPct}% 100%)`,
                  }}
                />
                <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-2xl font-bold">{weeklyGoalPct}%</span>
                  <span className="text-xs text-gray-400">목표 대비</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-800" />
                  달성
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-100" />
                  남음
                </span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white">
              <div className="flex items-center gap-2 text-sm font-medium text-emerald-200">
                <Flame size={18} />
                연속 달성일
              </div>
              <p className="mt-4 text-5xl font-bold">
                12<span className="ml-1 text-lg font-medium">일째</span>
              </p>
              <p className="mt-2 text-sm text-emerald-200">
                이 페이스를 유지하면 이번 달 최고 기록이에요.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}



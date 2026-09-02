"use client";

import { useLanguage } from "@/lib/i18n";

const COLORS = ["#a3e635", "#22d3ee", "#f472b6", "#fb923c", "#a78bfa", "#facc15"];

// 대시보드 "주간 목표 달성률"에서 쓴 것과 같은 conic-gradient 방식 — 여러 항목 비중을 도넛으로 표시
export function PieChart({ segments }: { segments: { label: string; value: number }[] }) {
  const { t } = useLanguage();
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <p className="text-sm text-zinc-500">{t("common.noData")}</p>;
  }

  let cursor = 0;
  const stops = segments.map((s, i) => {
    const start = cursor;
    cursor += (s.value / total) * 100;
    return `${COLORS[i % COLORS.length]} ${start}% ${cursor}%`;
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div
        className="h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      />
      <ul className="space-y-1.5 text-sm">
        {segments.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-zinc-300">{s.label}</span>
            <span className="text-zinc-500">
              {s.value}
              {t("common.repUnit")} ({Math.round((s.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

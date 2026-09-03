import { Dumbbell, Zap, TrendingUp, Footprints, Activity, HeartPulse, type LucideIcon } from "lucide-react";

const ICON: Record<string, LucideIcon> = {
  CHEST: Dumbbell,
  BACK: Zap,
  SHOULDER: TrendingUp,
  LEG: Footprints,
  ARM_ABS: Activity,
  CARDIO: HeartPulse,
};

const COLOR: Record<string, string> = {
  CHEST: "bg-lime-400/15 text-lime-300",
  BACK: "bg-cyan-400/15 text-cyan-300",
  SHOULDER: "bg-amber-400/15 text-amber-300",
  LEG: "bg-fuchsia-400/15 text-fuchsia-300",
  ARM_ABS: "bg-orange-400/15 text-orange-300",
  CARDIO: "bg-rose-400/15 text-rose-300",
};

// 실제 사람 사진 대신 쓰는 부위별 아이콘 — 개별 운동 사진은 안 보여주지만
// 최소한 "이건 어느 부위 운동인지"는 시각적으로 바로 알 수 있게 함
export function BodyPartIcon({ bodyPart, className }: { bodyPart: string; className?: string }) {
  const Icon = ICON[bodyPart] ?? Dumbbell;
  const color = COLOR[bodyPart] ?? "bg-white/10 text-zinc-300";
  return (
    <div className={`flex items-center justify-center rounded-lg ${color} ${className ?? ""}`}>
      <Icon size={20} />
    </div>
  );
}

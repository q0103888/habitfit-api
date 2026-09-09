"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
import { MaterialIcon } from "@/components/material-icon";
import { getExercises, type Exercise } from "@/lib/api";
import { BODY_PARTS } from "@/lib/constants";
import { useLanguage, bodyPartLabel } from "@/lib/i18n";
import { BodyPartIcon } from "@/components/body-part-icon";

export default function ExercisesPage() {
  return (
    <RequireAuth>
      <ExerciseGallery />
    </RequireAuth>
  );
}

// 운동 카탈로그를 부위별로 훑어보는 도감 페이지 — 오늘 뭘 할지 고를 때 참고용
function ExerciseGallery() {
  const { locale, t } = useLanguage();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedBodyPart, setSelectedBodyPart] = useState(BODY_PARTS[0].code);

  useEffect(() => {
    getExercises(locale).then(setExercises);
  }, [locale]);

  const filtered = exercises.filter((ex) => ex.bodyPart === selectedBodyPart);
  // KPI — 전부 실제 카탈로그 데이터에서 계산(가짜 "Neuromuscular models" 같은 지표 없음)
  const withPhotoCount = exercises.filter((ex) => ex.imageUrl).length;
  const bodyPartCount = new Set(exercises.map((ex) => ex.bodyPart)).size;

  return (
    <div className="relative flex min-h-screen w-full bg-surface-container-lowest text-on-surface">
      <div className="pointer-events-none fixed left-0 right-0 top-0 z-0 h-[480px] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(163,230,53,0.12),transparent_70%)]" />
      <Sidebar />
      <div className="relative z-10 min-w-0 flex-1">
        <header className="border-b border-white/[0.08] bg-surface-container-lowest/60 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-on-surface">{t("exercises.title")}</h1>
          <p className="mt-1 text-sm text-on-surface-variant">{t("exercises.subtitle")}</p>
        </header>

        <main className="p-6 lg:p-8">
          {/* 카탈로그 KPI — 전부 실제 데이터 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col justify-between rounded-xl bg-surface-container/60 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Indexed Database</span>
                <MaterialIcon name="database" className="text-[18px] text-primary-container" />
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold text-on-surface">{exercises.length}</span>
                <span className="text-xs text-on-surface-variant">Movements</span>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-surface-container/60 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">With Reference Photo</span>
                <MaterialIcon name="photo_camera" className="text-[18px] text-secondary" />
              </div>
              <span className="mt-2 font-mono text-2xl font-bold text-on-surface">{withPhotoCount}</span>
            </div>
            <div className="flex flex-col justify-between rounded-xl bg-surface-container/60 p-4 shadow-sm backdrop-blur-xl">
              <div className="flex items-center justify-between text-on-surface-variant">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Body Part Categories</span>
                <MaterialIcon name="category" className="text-[18px] text-tertiary" />
              </div>
              <span className="mt-2 font-mono text-2xl font-bold text-on-surface">{bodyPartCount}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {BODY_PARTS.map((part) => (
              <button
                key={part.code}
                onClick={() => setSelectedBodyPart(part.code)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  selectedBodyPart === part.code
                    ? "bg-primary-container text-on-primary-container shadow-[0_0_16px_rgba(163,230,53,0.35)]"
                    : "border border-white/[0.14] text-on-surface-variant hover:bg-white/[0.06]"
                }`}
              >
                {bodyPartLabel(part.code, t)}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <BodyPartIcon bodyPart={selectedBodyPart} className="h-12 w-12" />
            <h2 className="text-lg font-semibold text-on-surface">{bodyPartLabel(selectedBodyPart, t)}</h2>
            <span className="text-sm text-on-surface-variant">{filtered.length}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((ex) => (
              <div key={ex.id} className="rounded-xl bg-white/[0.04] p-3 shadow-sm backdrop-blur-xl">
                <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-surface-container-lowest">
                  {ex.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 외부 CDN 이미지, 도메인 목록이 계속 늘어날 수 있어 next/image 최적화 대상에서 제외
                    <img src={ex.imageUrl} alt={ex.displayName} className="h-full w-full object-contain" />
                  ) : (
                    <BodyPartIcon bodyPart={ex.bodyPart} className="h-12 w-12" />
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium text-on-surface">{ex.displayName}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

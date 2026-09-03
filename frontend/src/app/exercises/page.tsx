"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { RequireAuth } from "@/components/require-auth";
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

  return (
    <div className="flex min-h-screen w-full bg-black text-zinc-100">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-white/10 bg-black/40 px-6 py-4 backdrop-blur-xl lg:px-8">
          <h1 className="text-xl font-bold text-white">{t("exercises.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("exercises.subtitle")}</p>
        </header>

        <main className="p-6 lg:p-8">
          <div className="flex flex-wrap gap-2">
            {BODY_PARTS.map((part) => (
              <button
                key={part.code}
                onClick={() => setSelectedBodyPart(part.code)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                  selectedBodyPart === part.code
                    ? "bg-lime-400 text-black"
                    : "border border-white/15 text-zinc-300 hover:bg-white/5"
                }`}
              >
                {bodyPartLabel(part.code, t)}
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <BodyPartIcon bodyPart={selectedBodyPart} className="h-12 w-12" />
            <h2 className="text-lg font-semibold text-white">{bodyPartLabel(selectedBodyPart, t)}</h2>
            <span className="text-sm text-zinc-500">{filtered.length}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((ex) => (
              <div key={ex.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-black">
                  {ex.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 외부 CDN 이미지, 도메인 목록이 계속 늘어날 수 있어 next/image 최적화 대상에서 제외
                    <img src={ex.imageUrl} alt={ex.displayName} className="h-full w-full object-contain" />
                  ) : (
                    <BodyPartIcon bodyPart={ex.bodyPart} className="h-12 w-12" />
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-medium text-white">{ex.displayName}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

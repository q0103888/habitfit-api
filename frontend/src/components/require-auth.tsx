"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";

// 이걸로 감싼 화면은, 로그인 안 되어 있으면 자동으로 /login으로 튕겨나감
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    // isLoading이 끝났는데도(=확인 다 했는데도) user가 없으면 → 진짜 비로그인 상태
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // 확인 중이거나, 비로그인이라 곧 리다이렉트될 예정이면
  // 잠깐이라도 진짜 대시보드 내용이 보이지 않게 로딩 화면만 보여줌
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-400">
        {t("common.checking")}
      </div>
    );
  }

  return <>{children}</>;
}
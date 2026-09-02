"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { LanguageProvider } from "@/lib/i18n";

// layout.tsx(서버 컴포넌트)와 AuthProvider/LanguageProvider(클라이언트 컴포넌트) 사이를 이어주는 다리 역할만 함
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>{children}</AuthProvider>
    </LanguageProvider>
  );
}
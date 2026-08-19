"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth-context";

// layout.tsx(서버 컴포넌트)와 AuthProvider(클라이언트 컴포넌트) 사이를 이어주는 다리 역할만 함.
// 지금은 AuthProvider 하나뿐이지만, 나중에 다른 전역 Provider가 생기면 여기 같이 감싸면 됨
export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
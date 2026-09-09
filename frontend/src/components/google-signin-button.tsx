"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/i18n";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: { theme?: string; size?: string; width?: string },
          ) => void;
        };
      };
    };
  }
}

// 구글 4색 로고 — 구글 공식 브랜드 에셋 그대로
function GoogleLogo() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.7c-.2-.7-.4-1.4-.4-2.2s.2-1.5.4-2.2L1.6 7.4C.6 9.4 0 11.6 0 14.2s.6 4.8 1.6 6.8l3.7-2.9c-.4-.7-.6-1.5-.6-2.4z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.3-6.7-5.3L1.6 16.4C3.5 20.2 7.4 23.5 12 23.5z"
      />
    </svg>
  );
}

// Google Identity Services 스크립트를 로드하고, 실제 구글 버튼을 그리되 투명하게 숨겨서
// 클릭만 그 버튼이 받게 하고, 화면에는 디자인에 맞춘 우리 버튼을 그 위에 겹쳐서 보여줌
// (구글이 제공하는 renderButton 테마만으로는 이 디자인을 그대로 재현할 수 없어서 쓰는 방식).
// 로그인이 끝나면 구글이 바로 ID 토큰(credential)을 콜백으로 넘겨줌 — 리다이렉트 없음
export function GoogleSignInButton({ onToken }: { onToken: (idToken: string) => void }) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);

  const renderButton = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!window.google || !containerRef.current || !clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onToken(response.credential),
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      width: "100%",
    });
  }, [onToken]);

  // 로그인↔회원가입처럼 클라이언트 라우팅으로 이 컴포넌트가 다시 마운트될 때,
  // 구글 스크립트는 이미 로드돼있어 Script의 onLoad가 다시 안 불림 — 그래서 마운트 시점에
  // window.google이 이미 있으면 직접 렌더링해줌 (버튼이 사라지던 버그의 원인)
  useEffect(() => {
    if (window.google) renderButton();
  }, [renderButton]);

  return (
    <div className="relative h-11 w-full">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={renderButton} />

      {/* 화면에 보이는 디자인용 버튼 — 클릭 이벤트는 안 받음(pointer-events-none), 아래 실제 버튼이 받음 */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 text-xs font-semibold text-zinc-200">
        <GoogleLogo />
        <span>{t("auth.continueWithGoogle")}</span>
      </div>

      {/* 실제 구글 버튼 — 투명 처리해서 안 보이지만 클릭은 이게 받음 */}
      <div ref={containerRef} className="absolute inset-0 overflow-hidden rounded-xl opacity-0" />
    </div>
  );
}

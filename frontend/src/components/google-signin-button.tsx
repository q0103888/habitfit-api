"use client";

import Script from "next/script";
import { useRef } from "react";

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

// Google Identity Services 스크립트를 로드하고, 로드되면 구글이 제공하는 버튼을 그려줌.
// 버튼을 눌러 로그인이 끝나면 구글이 바로 ID 토큰(credential)을 콜백으로 넘겨줌 — 리다이렉트 없음
export function GoogleSignInButton({ onToken }: { onToken: (idToken: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleScriptLoad() {
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
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={handleScriptLoad} />
      <div ref={containerRef} />
    </>
  );
}

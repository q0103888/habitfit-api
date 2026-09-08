"use client";

import { useEffect, useState, type FormEvent } from "react";
import { MessageCircle, X } from "lucide-react";
import { askAssistant, ApiError, type AssistantHistoryItem } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/lib/auth-context";

function storageKey(email: string) {
  return `assistant-history:${email}`;
}

// 헬프데스크 스타일 플로팅 위젯 — 화면 우측 하단 버튼을 누르면 작은 채팅창이 뜸.
// 대화 기록은 계정별로 localStorage에 저장 — 새로고침해도 안 사라지고, 매 질문마다
// 이전 대화를 같이 보내서 Claude가 이어서 대화하는 것처럼 답하게 함
export function AssistantWidget() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<AssistantHistoryItem[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    try {
      const saved = localStorage.getItem(storageKey(user.email));
      setHistory(saved ? JSON.parse(saved) : []);
    } catch {
      setHistory([]);
    }
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || isAsking || !user) return;
    setError("");
    setIsAsking(true);
    const asked = question;
    setQuestion("");
    try {
      const { answer } = await askAssistant(asked, history);
      const next = [...history, { question: asked, answer }];
      setHistory(next);
      localStorage.setItem(storageKey(user.email), JSON.stringify(next));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("assistant.error"));
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[32rem] w-80 flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">{t("assistant.title")}</p>
              <p className="text-xs text-zinc-500">{t("assistant.subtitle")}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {history.length === 0 && !isAsking && (
              <p className="text-xs text-zinc-500">{t("assistant.emptyState")}</p>
            )}
            {history.map((qa, i) => (
              <div key={i} className="space-y-1.5">
                <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-lime-400 px-3 py-1.5 text-xs font-medium text-black">
                  {qa.question}
                </p>
                <p className="w-fit max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-100">
                  {qa.answer}
                </p>
              </div>
            ))}
            {isAsking && <p className="text-xs text-zinc-500">{t("assistant.asking")}</p>}
            {error && <p className="text-xs text-rose-400">{error}</p>}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("assistant.placeholder")}
              disabled={isAsking}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim()}
              className="rounded-xl bg-lime-400 px-3 py-2 text-xs font-semibold text-black hover:bg-lime-300 disabled:opacity-50"
            >
              {t("assistant.ask")}
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-lime-400 text-black shadow-[0_0_25px_-4px_rgba(163,230,53,0.7)] hover:bg-lime-300"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

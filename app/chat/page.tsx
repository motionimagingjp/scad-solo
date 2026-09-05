"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import ChatFooterSection, { type Mode } from "@/components/ChatFooterSection";

// AI相談タブ: 現状はモック版。
// モード+一言入力を送ると、固定のダミー店舗(spot_demo)を提案する。
// 実装時は onSend の中で /api/chat 等を呼び出し、DB検索結果をAIに選ばせる。

type SpotSuggestion = { id: string; name: string; reason: string; distanceLabel: string };

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "ai"; text: string; spot?: SpotSuggestion };

const FOOTER_HEIGHT = 110; // ChatFooterSection の想定高さ

const MOCK_SUGGESTIONS: Record<Mode, SpotSuggestion> = {
  SOLO_NOMI: { id: "spot_demo", name: "立飲み・〇〇", reason: "カウンター席・せんべろありで一人でもすぐ入れます", distanceLabel: "徒歩3分" },
  SOLO_MESHI: { id: "spot_demo", name: "立飲み・〇〇", reason: "一人でも入りやすいカウンター中心の店です", distanceLabel: "徒歩3分" },
  SOLO_SPOT: { id: "spot_demo", name: "立飲み・〇〇", reason: "近くで一人の時間を過ごせるスポットです", distanceLabel: "徒歩3分" },
};

let idCounter = 0;
const nextId = () => `m${++idCounter}`;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: nextId(), role: "ai", text: "今日の気分を教えてください。ぴったりの1軒を提案します。" },
  ]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  const handleSend = (text: string, mode: Mode) => {
    setMessages((prev) => [...prev, { id: nextId(), role: "user", text }]);
    setThinking(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: "ai", text: "この1軒はどうですか?", spot: MOCK_SUGGESTIONS[mode] },
      ]);
      setThinking(false);
    }, 600);
  };

  return (
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">AI相談</h1>
      </header>

      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: FOOTER_HEIGHT + NAV_HEIGHT + 16 }}
      >
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-orange-500 text-white" : "bg-white text-gray-700 shadow-sm"
              }`}
            >
              <p>{m.text}</p>
              {m.role === "ai" && m.spot && (
                <div className="mt-3 rounded-xl border bg-gray-50 p-3">
                  <p className="font-bold text-gray-900">{m.spot.name}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {m.spot.distanceLabel} · {m.spot.reason}
                  </p>
                  <Link
                    href={`/checkin/${m.spot.id}`}
                    className="mt-2 block rounded-full bg-orange-500 py-2 text-center text-xs font-bold text-white"
                  >
                    チェックイン
                  </Link>
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-400 shadow-sm">考え中...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatFooterSection onSend={handleSend} />
      <BottomNav />
    </div>
  );
}

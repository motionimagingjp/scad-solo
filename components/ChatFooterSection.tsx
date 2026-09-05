"use client";

import { useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { NAV_HEIGHT } from "@/components/BottomNav";

// 親指ファースト最適化:
// - 旧版はレターリンク/入力欄/モード切替が縦4段で約200pxを占有していたため、
//   レターリンクとモード切替を「同じ1行」に横並びさせ、全体を約110pxに圧縮。
// - ボトムナビの直上に固定(bottom: NAV_HEIGHT)し、片手で全操作が完結する。

export const MODES = [
  { id: "SOLO_NOMI", label: "🍺 ソロ飲み" },
  { id: "SOLO_MESHI", label: "🥩 ソロメシ" },
  { id: "SOLO_SPOT", label: "🏃 ソロスポット" },
] as const;
export type Mode = (typeof MODES)[number]["id"];

export default function ChatFooterSection({ onSend }: { onSend?: (text: string, mode: Mode) => void }) {
  const [mode, setMode] = useState<Mode>("SOLO_NOMI");
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    onSend?.(text.trim(), mode);
    setText("");
  };

  return (
    <div className="fixed inset-x-0 z-30 border-t bg-white px-3 pb-2 pt-2" style={{ bottom: NAV_HEIGHT }}>
      <div className="mx-auto max-w-md">
        {/* 1行目: モード切替(左) + レターリンク(右)。要件の「入力欄直上=レター/直下=モード」を1行に統合 */}
        <div className="mb-2 flex items-center gap-1">
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${mode === m.id ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <Link href="/mypage#ecosystem" className="shrink-0 text-[11px] text-gray-400">✉️ @motion.imaging</Link>
        </div>

        {/* 2行目: 入力欄 + 送信 */}
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="今日の気分に合う店を相談..."
            className="h-11 flex-1 rounded-full border px-4 text-sm"
          />
          <button onClick={submit} aria-label="送信" className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

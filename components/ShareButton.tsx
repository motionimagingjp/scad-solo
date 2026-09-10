"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { APP_ABOUT } from "@/lib/data/about";

// ヘッダーに置くアプリ共有ボタン。対応端末(主にスマホのブラウザ)はOS標準の
// 共有シートを開き、非対応(主にPCブラウザ)ではURLをクリップボードにコピーして
// チェックマークで一瞬フィードバックする。
export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.origin;
    const shareData = { title: "SCAD-SOLO", text: APP_ABOUT.tagline, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // ユーザーが共有をキャンセルした場合など。何もしない
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // クリップボードも使えない環境では何もしない
    }
  };

  return (
    <button
      onClick={handleShare}
      aria-label="アプリをシェア"
      className="flex shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-500"
      style={{ width: 34, height: 34 }}
    >
      {copied ? <Check size={16} className="text-orange-500" /> : <Share2 size={16} />}
    </button>
  );
}

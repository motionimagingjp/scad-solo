"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { BRAND } from "@/lib/brand";

// アプリ自体を人に勧めるための共有ボタン(特定の来店のシェアとは別物)。
// Web Share API対応端末はネイティブの共有シート(LINE等)を開き、非対応の
// デスクトップブラウザではURLをクリップボードにコピーする。

const SHARE_TEXT = BRAND.shareText;

export default function ShareAppButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: BRAND.appName, text: SHARE_TEXT, url });
      } catch {
        // ユーザーが共有をキャンセルしただけの場合も含むため、何もしない
      }
      return;
    }
    await navigator.clipboard.writeText(`${SHARE_TEXT} ${url}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border py-2 text-sm text-gray-600"
    >
      <Share2 size={16} />
      {copied ? "リンクをコピーしました" : "アプリをシェア"}
    </button>
  );
}

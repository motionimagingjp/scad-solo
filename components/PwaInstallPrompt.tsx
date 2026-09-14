"use client";

import { useEffect, useState } from "react";
import { Share, X, ChevronDown } from "lucide-react";
import { NAV_HEIGHT } from "@/components/BottomNav";

// localStorage キー。「後で」は7日、「閉じる」は30日、この時刻まで再表示しない
const DISMISS_KEY = "pwa_prompt_dismiss_until";
const SHOW_DELAY_MS = 1500;
const LATER_MS = 7 * 24 * 60 * 60 * 1000;
const CLOSE_MS = 30 * 24 * 60 * 60 * 1000;

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    // Chrome/Firefox for iOS や LINE・Instagram 内ブラウザなどは UA に safari を
    // 含むことがあるため、それらの識別子を除外して「素の Safari」だけに絞る
    const isSafari =
      isIos &&
      ua.includes("safari") &&
      !ua.includes("crios") &&
      !ua.includes("fxios") &&
      !ua.includes("edgios") &&
      !ua.includes("line") &&
      !ua.includes("fban") &&
      !ua.includes("fbav") &&
      !ua.includes("instagram");

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (!isIos || !isSafari || isStandalone) return;

    const dismissUntil = window.localStorage.getItem(DISMISS_KEY);
    if (dismissUntil && Date.now() < parseInt(dismissUntil, 10)) return;

    const timer = setTimeout(() => setShowPrompt(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = (durationMs: number) => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now() + durationMs));
    } catch {
      // localStorageが使えない環境（プライベートモード等）では単に非表示にするだけ
    }
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed inset-x-3 z-[200] mx-auto max-w-md transition-all duration-300 ease-in-out"
      style={{ bottom: `calc(${NAV_HEIGHT + 16}px + env(safe-area-inset-bottom))` }}
    >
      <div className="relative rounded-2xl border border-gray-200 bg-white/95 p-4 text-gray-800 shadow-2xl backdrop-blur-md">
        <button
          onClick={() => dismiss(CLOSE_MS)}
          aria-label="閉じる"
          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">📱</span>
          <h3 className="text-sm font-bold text-gray-900">iPhoneで毎日快適に使うには</h3>
        </div>

        <div className="mb-3 space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              1
            </span>
            <span className="inline-flex items-center gap-1">
              画面下の <strong className="text-orange-600">共有ボタン</strong>
              <Share size={14} className="inline" /> をタップ
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              2
            </span>
            <span>
              メニューから <strong className="font-semibold text-gray-900">「ホーム画面に追加」</strong> を選択
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => dismiss(LATER_MS)}
            className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-gray-600"
          >
            後で案内する
          </button>
          <div className="flex animate-bounce items-center gap-1 text-xs font-semibold text-orange-500">
            <span>下をチェック</span>
            <ChevronDown size={14} className="translate-y-0.5" />
          </div>
        </div>
      </div>
    </div>
  );
}

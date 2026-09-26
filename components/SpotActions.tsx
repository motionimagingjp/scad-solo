"use client";

import { useState, useTransition } from "react";
import { Heart, Check } from "lucide-react";
import { loginWithGoogle } from "@/app/actions/auth";

type Props = {
  spotId: string;
  loggedIn: boolean;
  initialFavorited: boolean;
  initialVisitedToday: boolean;
  initialVisitCount: number;
};

// 店舗詳細のお気に入り(ハート)と「行った！」。閲覧はログイン不要で、押した時だけログインを促す
export default function SpotActions({ spotId, loggedIn, initialFavorited, initialVisitedToday, initialVisitCount }: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [visitedToday, setVisitedToday] = useState(initialVisitedToday);
  const [visitCount, setVisitCount] = useState(initialVisitCount);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const requireLogin = () => {
    if (loggedIn) return false;
    if (confirm("この機能を使うにはGoogleでログインしてください。ログインしますか？")) {
      startTransition(() => loginWithGoogle(`/spot/${spotId}`));
    }
    return true;
  };

  const toggleFavorite = () => {
    if (requireLogin()) return;
    startTransition(async () => {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId }),
      });
      if (!res.ok) return setMessage("保存できませんでした");
      const data = await res.json();
      setFavorited(data.favorited);
      setMessage(null);
    });
  };

  const markVisited = () => {
    if (requireLogin() || visitedToday) return;
    startTransition(async () => {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotId }),
      });
      if (res.status === 409) {
        setVisitedToday(true);
        return setMessage("今日はもう記録済みです");
      }
      if (!res.ok) return setMessage("記録できませんでした");
      const data = await res.json();
      setVisitedToday(true);
      setVisitCount(data.visitCount);
      setMessage("記録しました！");
    });
  };

  return (
    <div>
      <div className="flex gap-2">
        <button
          onClick={toggleFavorite}
          disabled={busy}
          aria-pressed={favorited}
          className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full border text-sm font-bold ${
            favorited ? "border-pink-300 bg-pink-50 text-pink-600" : "bg-white text-gray-600"
          }`}
        >
          <Heart size={18} fill={favorited ? "currentColor" : "none"} />
          {favorited ? "行きたい登録済み" : "行きたい"}
        </button>
        <button
          onClick={markVisited}
          disabled={busy || visitedToday}
          className={`flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full text-sm font-bold ${
            visitedToday ? "bg-gray-200 text-gray-500" : "bg-orange-500 text-white"
          }`}
        >
          <Check size={18} />
          {visitedToday ? "今日は記録済み" : "行った！"}
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-gray-400">
        {message ?? (loggedIn ? `この店の記録: ${visitCount}回` : "記録するにはGoogleログインが必要です")}
      </p>
    </div>
  );
}

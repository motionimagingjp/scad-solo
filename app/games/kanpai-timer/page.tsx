"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

// 一人乾杯タイマー: 乾杯するたびにボタンを押すだけで、次の一杯までの間隔を記録する。
// 記録の目的は「今日は自分のペースを知る」程度のゆるいもので、飲酒を煽る要素は入れない
// (ペース表示はあくまで参考。「もっと飲め」的な演出は一切なし)。DBには保存しない、その場限りの記録。

type Phase = "idle" | "running" | "result";
type Drink = { atMs: number; intervalMs: number };

function formatClock(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function Hourglass() {
  return (
    <div className="hourglass" aria-hidden="true">
      <svg viewBox="0 0 60 84" width="60" height="84">
        <path d="M8,4 H52 V16 L30,40 L8,16 Z" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M8,80 H52 V68 L30,44 L8,68 Z" fill="none" stroke="#D85A30" strokeWidth="2.5" strokeLinejoin="round" />
        <clipPath id="topClip">
          <path d="M10,6 H50 V15 L30,38 L10,15 Z" />
        </clipPath>
        <clipPath id="bottomClip">
          <path d="M10,78 H50 V69 L30,46 L10,69 Z" />
        </clipPath>
        <rect className="sand-top" x="10" y="6" width="40" height="14" fill="#F0A868" clipPath="url(#topClip)" />
        <rect className="sand-bottom" x="10" y="60" width="40" height="20" fill="#F0A868" clipPath="url(#bottomClip)" />
        <rect className="sand-stream" x="29" y="38" width="2" height="8" fill="#F0A868" />
      </svg>
      <style jsx>{`
        .hourglass .sand-top {
          transform-origin: 30px 20px;
          animation: drain 3.2s linear infinite;
        }
        .hourglass .sand-bottom {
          animation: fill 3.2s linear infinite;
        }
        .hourglass .sand-stream {
          animation: stream 0.4s linear infinite;
        }
        @keyframes drain {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(0); }
        }
        @keyframes fill {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
        @keyframes stream {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (prefers-reduced-motion: reduce) {
          .hourglass .sand-top,
          .hourglass .sand-bottom,
          .hourglass .sand-stream {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default function KanpaiTimerPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [lastAt, setLastAt] = useState<number | null>(null);
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    const t = Date.now();
    setSessionStart(t);
    setLastAt(t);
    setDrinks([]);
    setNow(t);
    setPhase("running");
  };

  const kanpai = () => {
    const t = Date.now();
    if (lastAt === null) return;
    setDrinks((ds) => [...ds, { atMs: t, intervalMs: t - lastAt }]);
    setLastAt(t);
    setNow(t);
  };

  const finish = () => {
    setNow(Date.now());
    setPhase("result");
  };

  const playAgain = () => {
    setSessionStart(null);
    setLastAt(null);
    setDrinks([]);
    setPhase("idle");
  };

  const elapsedSinceLast = lastAt !== null ? now - lastAt : 0;
  const totalElapsed = sessionStart !== null ? now - sessionStart : 0;
  const avgIntervalMs = drinks.length > 0 ? drinks.reduce((sum, d) => sum + d.intervalMs, 0) / drinks.length : 0;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gray-50 pb-16">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/games" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">⏱ 一人乾杯タイマー</h1>
      </header>

      {phase === "idle" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <Hourglass />
          <p className="text-sm text-gray-500">
            乾杯するたびにボタンを押すだけ。
            <br />
            次の一杯までのペースを、あとで振り返れます。
          </p>
          <button onClick={start} className="w-full rounded-full bg-orange-500 py-3 text-sm font-bold text-white">
            はじめる
          </button>
          <p className="text-center text-[11px] text-gray-400">
            記録はこの画面を閉じると消えます。飲むペースを煽るものではありません、ご自身のペースでどうぞ。
          </p>
        </div>
      )}

      {phase === "running" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <Hourglass />
          <div>
            <p className="text-xs text-gray-400">次の乾杯まで</p>
            <p className="mt-1 font-mono text-4xl font-bold tabular-nums">{formatClock(elapsedSinceLast)}</p>
          </div>
          <button onClick={kanpai} className="rounded-full bg-orange-500 px-10 py-4 text-base font-bold text-white">
            🍻 乾杯
          </button>

          {drinks.length > 0 && (
            <div className="w-full rounded-2xl bg-white p-3 text-left shadow-sm">
              <p className="text-xs text-gray-400">これまでの記録({drinks.length}杯目まで)</p>
              <ul className="mt-2 space-y-1">
                {drinks
                  .slice(-3)
                  .reverse()
                  .map((d, i) => (
                    <li key={d.atMs} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{drinks.length - i}杯目</span>
                      <span className="font-mono tabular-nums text-gray-700">{formatClock(d.intervalMs)}</span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <button onClick={finish} className="w-full rounded-full border bg-white py-2.5 text-sm font-medium text-gray-600">
            記録を終える
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="flex-1 px-4 py-6">
          <p className="text-center text-lg font-bold">おつかれさまでした</p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white p-3 text-center shadow-sm">
              <p className="text-[11px] text-gray-400">合計</p>
              <p className="mt-1 text-xl font-bold">{drinks.length}杯</p>
            </div>
            <div className="rounded-xl bg-white p-3 text-center shadow-sm">
              <p className="text-[11px] text-gray-400">滞在時間</p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">{formatClock(totalElapsed)}</p>
            </div>
          </div>

          {drinks.length > 0 && (
            <div className="mt-2 rounded-xl bg-orange-50 p-3 text-center">
              <p className="text-[11px] text-orange-500">平均ペース(1杯あたり)</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums text-orange-600">{formatClock(avgIntervalMs)}</p>
            </div>
          )}

          {drinks.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
              <p className="text-xs text-gray-400">杯ごとの記録</p>
              <ul className="mt-2 space-y-1.5">
                {drinks.map((d, i) => (
                  <li key={d.atMs} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{i + 1}杯目</span>
                    <span className="font-mono tabular-nums text-gray-700">{formatClock(d.intervalMs)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {drinks.length === 0 && <p className="mt-6 text-center text-sm text-gray-400">乾杯の記録はありませんでした</p>}

          <button onClick={playAgain} className="mt-6 w-full rounded-full border bg-white py-3 text-sm font-medium text-gray-700">
            もう一度あそぶ
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

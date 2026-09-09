"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Camera } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { FALLBACK_DRINKS } from "@/lib/data/drinkRouletteFallback";

// ドリンクルーレット: メニューを撮影→Gemini(序盤の「考える」担当)が飲み物を4〜6個抽出
// →その場でルーレットを回して1つに決める。AIが読み取れない場合や未設定の場合は
// APIルート側(/api/roulette/extract)が定番リストへ自動フォールバックする。
// このページはfetch自体が失敗した場合(オフライン等)のみ、ここでもフォールバックする。

type Phase = "intro" | "loading" | "wheel" | "result";
type Source = "gemini" | "fallback" | "offline";

// 隣り合っても見分けやすいよう、色相をはっきり離した6色にしてある
// (以前はオレンジの濃淡だけで揃えていて、区別しづらいという指摘を受けて変更)
const WHEEL_COLORS = ["#F97316", "#2563EB", "#16A34A", "#DB2777", "#7C3AED", "#0891B2"];
const SPIN_DURATION_MS = 3400;
const WHEEL_SIZE = 208; // 元の260pxから20%縮小

function wheelBackground(n: number): string {
  const seg = 360 / n;
  const stops = Array.from({ length: n }, (_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`);
  return `conic-gradient(${stops.join(", ")})`;
}

export default function DrinkRoulettePage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [drinks, setDrinks] = useState<string[]>([]);
  const [source, setSource] = useState<Source>("gemini");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCamera = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じ写真を選び直しても発火するように
    if (!file) return;

    setPhase("loading");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/roulette/extract", { method: "POST", body: formData });
      const data = await res.json();
      const list: string[] = Array.isArray(data.drinks) && data.drinks.length > 0 ? data.drinks : pickFallback();
      setDrinks(list);
      setSource(data.source === "gemini" ? "gemini" : "fallback");
    } catch {
      setDrinks(pickFallback());
      setSource("offline");
    }
    setRotation(0);
    setResult(null);
    setPhase("wheel");
  };

  const pickFallback = () => [...FALLBACK_DRINKS].sort(() => Math.random() - 0.5).slice(0, 5);

  const spin = () => {
    if (spinning || drinks.length === 0) return;
    setSpinning(true);
    setResult(null);

    const seg = 360 / drinks.length;
    const idx = Math.floor(Math.random() * drinks.length);
    const jitter = (Math.random() - 0.5) * seg * 0.6;
    const targetWithinCircle = 360 - (idx * seg + seg / 2 + jitter);
    const spins = 5;
    const newRotation = rotation + spins * 360 + ((targetWithinCircle - (rotation % 360) + 360) % 360);
    setRotation(newRotation);

    setTimeout(() => {
      setResult(drinks[idx]);
      setSpinning(false);
      setPhase("result");
    }, SPIN_DURATION_MS);
  };

  const backToWheel = () => {
    setResult(null);
    setPhase("wheel");
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gray-50 pb-16">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/games" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">🍹 ドリンクルーレット</h1>
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {phase === "intro" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <span className="text-5xl">🍹</span>
          <p className="text-sm text-gray-500">
            メニューや壁のドリンクリストを撮影すると、AIが4〜6個の候補を選び出します。
            <br />
            あとはルーレットで1つに決めるだけ。
          </p>
          <button onClick={openCamera} className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-bold text-white">
            <Camera size={16} />
            メニューを撮る
          </button>
          <p className="rounded-xl bg-orange-50 px-4 py-2.5 text-[11px] leading-relaxed text-orange-600">
            📷 コツ: 全体より、3〜6品くらいに近づいて・明るい方を向いて撮ると読み取り精度UP
          </p>
        </div>
      )}

      {phase === "loading" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          <p className="text-sm text-gray-500">AIがメニューを読み取り中...</p>
        </div>
      )}

      {(phase === "wheel" || phase === "result") && drinks.length > 0 && (
        <div className="flex flex-1 flex-col items-center gap-5 px-6 py-6">
          {source !== "gemini" && (
            <div className="w-full rounded-xl bg-gray-100 px-3.5 py-2.5 text-center text-[11px] text-gray-500">
              <p>メニューをうまく読み取れなかったので定番リストです</p>
              <p className="mt-1">
                3〜6品くらいに近づいて、明るい方を向いてもう一度撮ると通りやすいです
              </p>
              <button onClick={openCamera} className="mt-2 rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-medium text-gray-600">
                撮り直す
              </button>
            </div>
          )}

          <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
            <div
              className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1"
              style={{ width: 0, height: 0, borderLeft: "10px solid transparent", borderRight: "10px solid transparent", borderTop: "16px solid #9A3412" }}
            />
            <div
              className="h-full w-full rounded-full border-4 border-white shadow-md"
              style={{
                background: wheelBackground(drinks.length),
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.2, 0.65, 0.15, 1)` : undefined,
              }}
            />
            <div className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />
          </div>

          <div className="grid w-full grid-cols-1 gap-2.5">
            {drinks.map((d, i) => (
              <div key={d} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <span
                  className="h-[30px] w-[30px] shrink-0 rounded-lg shadow-sm"
                  style={{ backgroundColor: WHEEL_COLORS[i % WHEEL_COLORS.length] }}
                />
                {d}
              </div>
            ))}
          </div>

          {phase === "wheel" && (
            <button
              onClick={spin}
              disabled={spinning}
              className="w-full rounded-full bg-orange-500 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {spinning ? "回転中..." : "ルーレットを回す"}
            </button>
          )}

          {phase === "result" && result && (
            <div className="flex w-full flex-col items-center gap-4">
              <p className="rounded-2xl bg-orange-50 px-6 py-4 text-center text-lg font-bold text-orange-600">
                🍹 {result} に決定!
              </p>
              <div className="flex w-full gap-2">
                <button onClick={backToWheel} className="flex-1 rounded-full border bg-white py-2.5 text-sm font-medium text-gray-700">
                  もう一度回す
                </button>
                <button onClick={openCamera} className="flex-1 rounded-full border bg-white py-2.5 text-sm font-medium text-gray-700">
                  別の写真で試す
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Camera, Image as ImageIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { FALLBACK_DRINKS } from "@/lib/data/drinkRouletteFallback";

// ドリンクルーレット: 開いた瞬間から定番5候補でルーレットを回せる。
// メニューや壁のドリンクリストを撮影すると、Gemini(序盤の「考える」担当)が
// 実際の候補に差し替えてくれる(未設定・API失敗・抽出結果が少なすぎる場合は
// APIルート側(/api/roulette/extract)が定番リストへ自動フォールバックする)。
// fetch自体が失敗した場合(オフライン等)のみ、ここでもフォールバックする。

type Phase = "loading" | "wheel" | "result";
type Source = "default" | "gemini" | "fallback" | "offline";

// 隣り合っても見分けやすいよう、色相をはっきり離した6色にしてある
// (以前はオレンジの濃淡だけで揃えていて、区別しづらいという指摘を受けて変更。
// さらに紫が青と紛らわしいとの指摘で薄い黄色に、緑はルーレット定番の緑に変更)
const WHEEL_COLORS = ["#F97316", "#2563EB", "#00A551", "#DB2777", "#FDE047", "#0891B2"];
const SPIN_DURATION_MS = 3400;
const WHEEL_SIZE = 208; // 元の260pxから20%縮小

function wheelBackground(n: number): string {
  const seg = 360 / n;
  const stops = Array.from({ length: n }, (_, i) => `${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${i * seg}deg ${(i + 1) * seg}deg`);
  return `conic-gradient(${stops.join(", ")})`;
}

export default function DrinkRoulettePage() {
  const [phase, setPhase] = useState<Phase>("wheel");
  const [drinks, setDrinks] = useState<string[]>(() => [...FALLBACK_DRINKS]);
  const [source, setSource] = useState<Source>("default");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const openCamera = () => cameraInputRef.current?.click();
  const openGallery = () => galleryInputRef.current?.click();

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

  const pickFallback = () => [...FALLBACK_DRINKS];

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

      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {phase === "loading" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-orange-500" />
          <p className="text-sm text-gray-500">AIがメニューを読み取り中...</p>
        </div>
      )}

      {(phase === "wheel" || phase === "result") && drinks.length > 0 && (
        <div className="flex flex-1 flex-col items-center gap-5 px-6 py-6">
          {source === "default" && (
            <div className="w-full rounded-xl bg-orange-50 px-3.5 py-2.5 text-center text-[11px] leading-relaxed text-orange-600">
              <p>まずは定番5候補で回せます。メニューを撮ると候補を差し替えられます。</p>
              <div className="mt-2 flex justify-center gap-2">
                <button onClick={openCamera} className="flex items-center gap-1 rounded-full border border-orange-300 bg-white px-3 py-1 text-[11px] font-medium text-orange-600">
                  <Camera size={12} />
                  撮る
                </button>
                <button onClick={openGallery} className="flex items-center gap-1 rounded-full border border-orange-300 bg-white px-3 py-1 text-[11px] font-medium text-orange-600">
                  <ImageIcon size={12} />
                  アルバムから選ぶ
                </button>
              </div>
            </div>
          )}

          {(source === "fallback" || source === "offline") && (
            <div className="w-full rounded-xl bg-gray-100 px-3.5 py-2.5 text-center text-[11px] text-gray-500">
              <p>メニューをうまく読み取れなかったので定番リストです</p>
              <p className="mt-1">
                3〜6品くらいに近づいて、明るい方を向いてもう一度撮ると通りやすいです
              </p>
              <div className="mt-2 flex justify-center gap-2">
                <button onClick={openCamera} className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-medium text-gray-600">
                  撮り直す
                </button>
                <button onClick={openGallery} className="rounded-full border border-gray-300 bg-white px-3 py-1 text-[11px] font-medium text-gray-600">
                  アルバムから選ぶ
                </button>
              </div>
            </div>
          )}

          {/* 決定表示バー: ルーレットの真上に固定し、下より視線が行きやすい位置で結果を見せる */}
          <div
            className={`w-full rounded-2xl px-6 py-4 text-center transition-colors ${
              phase === "result" ? "bg-orange-50" : "bg-gray-100"
            }`}
          >
            {phase === "result" && result ? (
              <p className="text-lg font-bold text-orange-600">🍹 {result} に決定!</p>
            ) : (
              <p className="text-base font-bold text-gray-500">🎯 運命の一投</p>
            )}
          </div>

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

          <div className="grid w-full grid-cols-1 gap-2">
            {drinks.map((d, i) => (
              <div key={d} className="flex items-center gap-2.5 text-sm font-medium text-gray-700">
                <span
                  className="h-[15px] w-[15px] shrink-0 rounded-md shadow-sm"
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
              className="w-full rounded-full bg-[#E4002B] py-3 text-sm font-bold text-white shadow-md shadow-red-500/30 disabled:opacity-50"
            >
              {spinning ? "回転中..." : "ルーレットを回す"}
            </button>
          )}

          {phase === "result" && result && (
            <div className="flex w-full gap-2">
              <button onClick={backToWheel} className="flex-1 rounded-full border bg-white py-2.5 text-sm font-medium text-gray-700">
                もう一度回す
              </button>
              <button onClick={openGallery} className="flex-1 rounded-full border bg-white py-2.5 text-sm font-medium text-gray-700">
                別の写真で試す
              </button>
            </div>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  );
}

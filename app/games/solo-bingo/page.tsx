"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, VenetianMask } from "lucide-react";
import BottomNav from "@/components/BottomNav";

// ソロビンゴ: 3×3のマスに並んだお題を、達成したら自己申告でタップしてチェックする
// (店員さんへの過度な要求や、見知らぬ客への突撃のような、店や周りに迷惑がかかる
// お題は入れない)。縦・横・斜めが揃うとビンゴ。
// マスの並びは「最初の1〜2マスがすぐ埋まる」体験を作るための意図的な配置なので
// シャッフルしない(四隅・上段=すぐ埋まる、中央=ネタ枠、右下=アプリ回遊)。
// 進行状況はDBには保存しないが、右下マス(店舗検索への導線)だけは押すと画面を
// 離れるため、戻ってきたときに消えないようsessionStorageにだけ退避する。

const SIZE = 3;
const STORAGE_KEY = "solo-bingo-achieved-v2";

type BingoCategory = "order" | "self" | "communication" | "app";
type BingoTask = {
  id: string;
  text: string;
  category: BingoCategory;
  difficulty: 1 | 2 | 3;
  special?: "spy" | "deeplink";
};

// 配置は左上→右下の順(3×3を行優先で並べたもの)。将来お題をシャッフル/入れ替え
// できるよう、テキストだけでなくカテゴリ・難易度・特殊フラグを持つオブジェクトにしてある。
const BINGO_TASKS: BingoTask[] = [
  { id: "selfie", text: "笑顔とドリンクを一緒に自撮りする", category: "self", difficulty: 1 },
  { id: "house-drink", text: "お店の一押しドリンクを頼む", category: "order", difficulty: 1 },
  { id: "house-food", text: "店員さんに「今日の一押しフード」を聞いて頼む", category: "communication", difficulty: 2 },
  { id: "no-repeat-genre", text: "一度飲んだジャンルのお酒は二度頼まない", category: "order", difficulty: 2 },
  { id: "impression", text: "誰にもバレずに10分以内にモノマネをする", category: "self", difficulty: 3, special: "spy" },
  { id: "mystery-dish", text: "普段は絶対頼まない「謎の小鉢・一品」に挑む", category: "order", difficulty: 2 },
  { id: "self-praise", text: "伝説の昭和ギャグ(ポーズ)をやる", category: "self", difficulty: 1 },
  { id: "inspired-message", text: "気になった漢字・名前から思い浮かんだ人にメッセージする", category: "communication", difficulty: 2 },
  { id: "search-next", text: "次行く店を本アプリで再検索する", category: "app", difficulty: 1, special: "deeplink" },
];

const LINES: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const POINTS_PER_LINE = 40;

const CATEGORY_META: Record<BingoCategory, { label: string; dot: string }> = {
  order: { label: "注文", dot: "bg-orange-400" },
  self: { label: "自分", dot: "bg-blue-400" },
  communication: { label: "会話", dot: "bg-pink-400" },
  app: { label: "アプリ", dot: "bg-emerald-400" },
};

function difficultyStars(d: number): string {
  return "★".repeat(d) + "☆".repeat(3 - d);
}

function textSizeClass(text: string): string {
  if (text.length > 20) return "text-[9px] leading-snug";
  if (text.length > 14) return "text-[10px] leading-snug";
  return "text-xs leading-snug";
}

function loadAchieved(): boolean[] {
  if (typeof window === "undefined") return Array(SIZE * SIZE).fill(false);
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed) && parsed.length === SIZE * SIZE) return parsed;
  } catch {
    // 破損データは無視して初期状態から始める
  }
  return Array(SIZE * SIZE).fill(false);
}

function saveAchieved(achieved: boolean[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(achieved));
  } catch {
    // sessionStorageが使えない環境でもゲーム自体は続けられるようにする
  }
}

// 効果音はアセットを使わず、その場でWeb Audioの短いトーンを鳴らすだけにしてある
function playTone(freq: number, durationMs: number) {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
    osc.onended = () => ctx.close();
  } catch {
    // 音が鳴らせない環境(自動再生制限など)では静かに無視する
  }
}

export default function SoloBingoPage() {
  const [achieved, setAchieved] = useState<boolean[]>(() => loadAchieved());
  const [poppingIndex, setPoppingIndex] = useState<number | null>(null);
  const prevLineCountRef = useRef(0);

  useEffect(() => {
    saveAchieved(achieved);
  }, [achieved]);

  const completedLines = LINES.filter((line) => line.every((i) => achieved[i]));

  useEffect(() => {
    if (completedLines.length > prevLineCountRef.current) {
      playTone(880, 260);
    }
    prevLineCountRef.current = completedLines.length;
    // completedLines.lengthの変化だけを見ればよいので依存はそれだけに絞る
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedLines.length]);

  const toggleCell = (i: number) => {
    const willAchieve = !achieved[i];
    setAchieved((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
    setPoppingIndex(i);
    setTimeout(() => setPoppingIndex((cur) => (cur === i ? null : cur)), 260);
    if (willAchieve) playTone(523, 120);
  };

  const goSearch = (i: number) => {
    setAchieved((prev) => {
      const next = prev.map((v, idx) => (idx === i ? true : v));
      saveAchieved(next); // Link遷移前に確実に退避しておく
      return next;
    });
    playTone(523, 120);
  };

  const reset = () => {
    setAchieved(Array(SIZE * SIZE).fill(false));
    prevLineCountRef.current = 0;
  };

  const achievedCount = achieved.filter(Boolean).length;
  const isPerfect = achievedCount === SIZE * SIZE;
  const points =
    BINGO_TASKS.reduce((sum, task, i) => sum + (achieved[i] ? task.difficulty * 10 : 0), 0) +
    completedLines.length * POINTS_PER_LINE;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gray-50 pb-16">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/games" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">🎯 ソロビンゴ</h1>
      </header>

      <div className="flex flex-1 flex-col items-center gap-4 px-6 py-6">
        <p className="text-center text-xs text-gray-400">
          達成できたお題をタップ。縦・横・斜めが揃うとビンゴ!
        </p>

        <div
          className={`w-full rounded-2xl px-6 py-4 text-center transition-colors ${
            completedLines.length > 0 ? "bg-orange-50" : "bg-gray-100"
          }`}
        >
          {isPerfect ? (
            <p className="text-lg font-bold text-orange-600">🎉 パーフェクト!</p>
          ) : completedLines.length > 0 ? (
            <p className="text-lg font-bold text-orange-600">🎯 ビンゴ! ({completedLines.length}本)</p>
          ) : (
            <p className="text-base font-bold text-gray-500">お題に挑戦しよう</p>
          )}
          <p className="mt-1 text-xs text-orange-500">現在 {points}pt</p>
        </div>

        <div className="grid w-full grid-cols-3 gap-2">
          {BINGO_TASKS.map((task, i) => {
            const isAchieved = achieved[i];
            const isPopping = poppingIndex === i;
            const isSpy = task.special === "spy";
            const cardClass = `flex min-h-[104px] flex-col justify-between rounded-xl border p-2 text-left transition-all duration-150 ${
              isPopping ? "scale-105" : "scale-100"
            } ${
              isAchieved
                ? "border-orange-400 bg-orange-500 text-white"
                : isSpy
                  ? "border-dashed border-purple-300 bg-purple-50 text-gray-700"
                  : "border-gray-200 bg-white text-gray-600"
            }`;

            const header = isSpy ? (
              <span
                className={`flex items-center gap-1 self-start rounded-full px-1.5 py-0.5 text-[8px] font-bold ${
                  isAchieved ? "bg-white/20 text-white" : "bg-purple-100 text-purple-600"
                }`}
              >
                <VenetianMask size={9} /> スパイ級
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[8px]">
                <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_META[task.category].dot}`} />
                <span className={isAchieved ? "text-white/80" : "text-gray-400"}>
                  {CATEGORY_META[task.category].label}
                </span>
                <span className={`ml-auto ${isAchieved ? "text-white/80" : "text-gray-300"}`}>
                  {difficultyStars(task.difficulty)}
                </span>
              </span>
            );

            const body = <p className={`font-medium ${textSizeClass(task.text)}`}>{task.text}</p>;

            if (task.special === "deeplink") {
              return (
                <Link key={task.id} href="/" onClick={() => goSearch(i)} className={cardClass}>
                  {header}
                  {body}
                </Link>
              );
            }

            return (
              <button key={task.id} onClick={() => toggleCell(i)} className={cardClass}>
                {header}
                {body}
              </button>
            );
          })}
        </div>

        <button onClick={reset} className="w-full rounded-full border bg-white py-2.5 text-sm font-medium text-gray-700">
          はじめから
        </button>

        <p className="text-center text-[11px] text-gray-400">
          自己申告のゆるいゲームです。記録はこの画面を閉じると消えます。
        </p>
      </div>

      <BottomNav />
    </div>
  );
}

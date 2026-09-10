"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

// ソロビンゴ: 3×3のマスに並んだお題を、達成したら自己申告でタップしてチェックする
// (店員さんへの過度な要求や、見知らぬ客への突撃のような、店や周りに迷惑がかかる
// お題は入れない)。縦・横・斜めが揃うとビンゴ。DBには保存しない、その場限りの記録。

const SIZE = 3;

const BINGO_TASKS: string[] = [
  "誰かに一杯奢る",
  "知人・友人に思いつきでLINEを送り、誰かから返信が来るまで飲む",
  "店員さんにおすすめを聞いて、それを頼む",
  "名前を聞いたことのない一杯を頼む",
  "隣の人・カウンターの人にひとこと話しかける",
  "普段は頼まないジャンルの一品を注文する",
  "今夜の一杯を写真に撮る",
  "店員さんに「次に行くならどこがいいか」を聞いてみる",
  "今日あった良いことを思い出しながら、心の中で乾杯する",
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

const POINTS_PER_CELL = 10;
const POINTS_PER_LINE = 30;

function shuffled(tasks: string[]): string[] {
  return [...tasks].sort(() => Math.random() - 0.5);
}

export default function SoloBingoPage() {
  const [tasks, setTasks] = useState<string[]>(() => shuffled(BINGO_TASKS));
  const [achieved, setAchieved] = useState<boolean[]>(() => Array(SIZE * SIZE).fill(false));

  const toggleCell = (i: number) => {
    setAchieved((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  };

  const reset = () => {
    setTasks(shuffled(BINGO_TASKS));
    setAchieved(Array(SIZE * SIZE).fill(false));
  };

  const completedLines = LINES.filter((line) => line.every((i) => achieved[i]));
  const achievedCount = achieved.filter(Boolean).length;
  const isPerfect = achievedCount === SIZE * SIZE;
  const points = achievedCount * POINTS_PER_CELL + completedLines.length * POINTS_PER_LINE;

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
          {tasks.map((task, i) => (
            <button
              key={task}
              onClick={() => toggleCell(i)}
              className={`flex aspect-square flex-col items-center justify-center rounded-xl border p-1.5 text-center text-[10px] font-medium leading-tight transition-colors ${
                achieved[i] ? "border-orange-400 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-600"
              }`}
            >
              {task}
            </button>
          ))}
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

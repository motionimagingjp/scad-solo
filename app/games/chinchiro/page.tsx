"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";

// ソロチン: その場にいる複数人(2〜8人)で1台のスマホを回して遊ぶチンチロ。
// 「人数を入れて対戦」という元の企画通り、対戦相手はランダムな胴元ではなく実在の人。
// ペナルティはギャンブル性を出さないよう「最下位がトップに1杯奢る」の1種類だけに絞ってある
// (一気飲み等は入れない)。DBには保存しない、その場限りの遊び。
//
// 1人を選んだ場合だけは例外で、実質2人プレイ(1投目=AI、2投目=ユーザー)として動かす。
// 誰も隣にいなくても遊べるようにするための追加モードで、役の判定・進行は通常の
// 2人対戦と完全に同じ。結果表示だけ「プレイヤー1/2」を「AI/あなた」に読み替える。

type DieValue = 1 | 2 | 3 | 4 | 5 | 6;
type RollResult = { player: number; dice: [DieValue, DieValue, DieValue]; label: string; rankValue: number };
type Phase = "setup" | "turn" | "revealed" | "result";

const PIP_POSITIONS: Record<DieValue, string[]> = {
  1: ["c"],
  2: ["tl", "br"],
  3: ["tl", "c", "br"],
  4: ["tl", "tr", "bl", "br"],
  5: ["tl", "tr", "c", "bl", "br"],
  6: ["tl", "tr", "ml", "mr", "bl", "br"],
};

const PIP_CLASS: Record<string, string> = {
  tl: "col-start-1 row-start-1",
  tr: "col-start-3 row-start-1",
  ml: "col-start-1 row-start-2",
  c: "col-start-2 row-start-2",
  mr: "col-start-3 row-start-2",
  bl: "col-start-1 row-start-3",
  br: "col-start-3 row-start-3",
};

function Die({ value }: { value: DieValue }) {
  return (
    <div className="grid h-14 w-14 grid-cols-3 grid-rows-3 gap-0.5 rounded-xl border bg-white p-2 shadow-sm">
      {PIP_POSITIONS[value].map((pos, i) => (
        <span key={i} className={`h-2.5 w-2.5 place-self-center rounded-full bg-gray-800 ${PIP_CLASS[pos]}`} />
      ))}
    </div>
  );
}

// 役の判定。数字が大きいほど強い(ピンゾロ > ゾロ目 > シゴロ > n の目 > 目なし > ヒフミ)
function evaluateRoll(dice: DieValue[]): { label: string; rankValue: number } {
  const [a, b, c] = [...dice].sort((x, y) => x - y);

  if (a === b && b === c) {
    if (a === 1) return { label: "ピンゾロ!!", rankValue: 1000 };
    return { label: `ゾロ目(${a})`, rankValue: 900 + a };
  }
  if (a === 1 && b === 2 && c === 3) return { label: "ヒフミ(役なし)", rankValue: -100 };
  if (a === 4 && b === 5 && c === 6) return { label: "シゴロ", rankValue: 800 };
  if (a === b || b === c) {
    const single = a === b ? c : a;
    return { label: `${single}の目`, rankValue: single };
  }
  return { label: "目なし", rankValue: 0 };
}

function rollDice(): [DieValue, DieValue, DieValue] {
  const roll = () => (Math.floor(Math.random() * 6) + 1) as DieValue;
  return [roll(), roll(), roll()];
}

// 1人モード用のプレイヤー表示名(それ以外は「プレイヤーN」のまま)
function soloPlayerLabel(player: number): string {
  return player === 1 ? "AI" : "あなた";
}

export default function ChinchiroPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [playerCount, setPlayerCount] = useState(3);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [results, setResults] = useState<RollResult[]>([]);
  const [currentDice, setCurrentDice] = useState<[DieValue, DieValue, DieValue] | null>(null);

  const soloMode = playerCount === 1;
  const effectivePlayerCount = soloMode ? 2 : playerCount;

  const startGame = () => {
    setResults([]);
    setCurrentPlayer(1);
    setCurrentDice(null);
    setPhase("turn");
  };

  const roll = () => {
    const dice = rollDice();
    setCurrentDice(dice);
    setPhase("revealed");
  };

  // 1人モードの1投目(AI)は自動で振る。「渡す」相手がいないので待たせない
  useEffect(() => {
    if (phase === "turn" && soloMode && currentPlayer === 1) {
      const t = setTimeout(roll, 900);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentPlayer, soloMode]);

  const nextPlayer = () => {
    if (!currentDice) return;
    const { label, rankValue } = evaluateRoll(currentDice);
    const updated = [...results, { player: currentPlayer, dice: currentDice, label, rankValue }];
    setResults(updated);
    setCurrentDice(null);

    if (currentPlayer >= effectivePlayerCount) {
      setPhase("result");
    } else {
      setCurrentPlayer((p) => p + 1);
      setPhase("turn");
    }
  };

  const playAgain = () => {
    setResults([]);
    setCurrentPlayer(1);
    setCurrentDice(null);
    setPhase("setup");
  };

  // 順位: 役の強さ順。同点は振った順(先に振った方が上位)で確定させる
  const ranked = [...results]
    .map((r, i) => ({ ...r, order: i }))
    .sort((x, y) => y.rankValue - x.rankValue || x.order - y.order);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gray-50 pb-16">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/games" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">🎲 ソロチン</h1>
      </header>

      {phase === "setup" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6">
          <p className="text-sm text-gray-500">今日は何人で遊ぶ?</p>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setPlayerCount((n) => Math.max(1, n - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border text-xl text-gray-600"
              aria-label="人数を減らす"
            >
              −
            </button>
            <span className="w-16 text-center text-4xl font-bold">{playerCount}</span>
            <button
              onClick={() => setPlayerCount((n) => Math.min(8, n + 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border text-xl text-gray-600"
              aria-label="人数を増やす"
            >
              +
            </button>
          </div>
          <button onClick={startGame} className="w-full rounded-full bg-orange-500 py-3 text-center text-sm font-bold text-white">
            はじめる
          </button>
          {playerCount === 1 ? (
            <p className="text-center text-[11px] text-gray-400">
              1人を選ぶと、AIと1対1で勝負します。
              <br />
              先にAIが振り、続けてあなたが振って役を競います。
            </p>
          ) : (
            <p className="text-center text-[11px] text-gray-400">
              1台のスマホを順番に回してください。役が一番強かった人の勝ち。
              <br />
              最下位が1位に1杯奢る、くらいの軽いノリでどうぞ。
            </p>
          )}
        </div>
      )}

      {phase === "turn" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
          {soloMode && currentPlayer === 1 ? (
            <div>
              <p className="text-2xl font-bold">🤖 AIの番です</p>
              <p className="mt-2 flex items-center justify-center gap-2 text-xs text-gray-400">
                <span className="h-2 w-2 animate-ping rounded-full bg-orange-400" />
                考え中...
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400">
                {currentPlayer} / {effectivePlayerCount} 人目
              </p>
              <p className="mt-2 text-2xl font-bold">
                {soloMode ? "あなたの番です" : `プレイヤー${currentPlayer}の番です`}
              </p>
              {!soloMode && <p className="mt-1 text-xs text-gray-400">📱をこの人に渡してください</p>}
            </div>
          )}
          {!(soloMode && currentPlayer === 1) && (
            <button onClick={roll} className="rounded-full bg-orange-500 px-10 py-4 text-base font-bold text-white">
              🎲 振る
            </button>
          )}
        </div>
      )}

      {phase === "revealed" && currentDice && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-sm text-gray-500">
            {soloMode ? soloPlayerLabel(currentPlayer) : `プレイヤー${currentPlayer}`}
          </p>
          <div className="flex gap-3">
            {currentDice.map((v, i) => (
              <Die key={i} value={v} />
            ))}
          </div>
          <p className="rounded-2xl bg-orange-50 px-6 py-3 text-lg font-bold text-orange-600">
            {evaluateRoll(currentDice).label}
          </p>
          <button onClick={nextPlayer} className="w-full rounded-full bg-orange-500 py-3 text-sm font-bold text-white">
            {currentPlayer >= effectivePlayerCount ? "結果を見る" : soloMode ? "あなたの番へ" : "次のプレイヤーへ"}
          </button>
        </div>
      )}

      {phase === "result" && ranked.length > 0 && (
        <div className="flex-1 px-4 py-6">
          <p className="text-center text-lg font-bold">結果発表</p>

          {soloMode && (
            <p className={`mt-2 text-center text-xl font-bold ${ranked[0].player === 2 ? "text-orange-500" : "text-gray-500"}`}>
              {ranked[0].player === 2 ? "🎉 あなたの勝ち!" : "🤖 AIの勝ち..."}
            </p>
          )}

          <div className="mt-4 space-y-2">
            {ranked.map((r, i) => (
              <div key={r.player} className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm">
                <span className={`w-7 text-center text-sm font-bold ${i === 0 ? "text-orange-500" : "text-gray-400"}`}>
                  {i + 1}位
                </span>
                <div className="flex gap-1">
                  {r.dice.map((v, j) => (
                    <span key={j} className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-[11px] font-bold text-gray-600">
                      {v}
                    </span>
                  ))}
                </div>
                <span className="flex-1 text-sm font-medium">
                  {soloMode ? soloPlayerLabel(r.player) : `プレイヤー${r.player}`}
                </span>
                <span className="text-xs text-gray-400">{r.label}</span>
              </div>
            ))}
          </div>

          {!soloMode && ranked.length >= 2 && (
            <div className="mt-5 rounded-2xl bg-orange-50 p-4 text-center">
              <p className="text-sm font-bold text-orange-600">
                🍺 プレイヤー{ranked[ranked.length - 1].player}(最下位)→ プレイヤー{ranked[0].player}(1位)に1杯
              </p>
            </div>
          )}

          <button onClick={playAgain} className="mt-6 w-full rounded-full border bg-white py-3 text-sm font-medium text-gray-700">
            もう一度あそぶ
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

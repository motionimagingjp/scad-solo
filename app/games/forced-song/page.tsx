"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { SONGS, type Song } from "@/lib/data/songs";

// 強制選曲モード: 3曲引いて、その中から1曲を選ぶ。選んだら1番(サビ前)は最後まで歌いきる。
// 「気に入らないから引き直す」を許すと結局選び放題になってしまうため、
// 一度引いた3曲からは必ずどれか1つを選ぶ(再抽選は次の番から)。

type Phase = "intro" | "picking" | "committed";

function pickThree(): Song[] {
  const shuffled = [...SONGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export default function ForcedSongPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [candidates, setCandidates] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);

  const draw = () => {
    setCandidates(pickThree());
    setSelected(null);
    setPhase("picking");
  };

  const choose = (song: Song) => {
    setSelected(song);
    setPhase("committed");
  };

  const finish = () => setPhase("intro");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-gray-50 pb-16">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/games" className="flex items-center text-xs text-gray-400">
          <ChevronLeft size={16} /> 戻る
        </Link>
        <h1 className="text-base font-bold">🎤 強制選曲モード</h1>
      </header>

      {phase === "intro" && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <span className="text-5xl">🎤</span>
          <p className="text-sm text-gray-500">
            3曲引いて、その中から1曲。
            <br />
            選んだら1番は最後まで歌いきること。
          </p>
          <p className="rounded-xl bg-orange-50 px-4 py-2.5 text-xs font-medium text-orange-600">
            知らなくても知ってるフリで歌うのがルール。恥ずかしさに耐えて1番を歌いきろう!
          </p>
          <button onClick={draw} className="w-full rounded-full bg-orange-500 py-3 text-sm font-bold text-white">
            3曲を引く
          </button>
          <p className="text-center text-[11px] text-gray-400">
            気に入らなくても引き直しはナシ。次の番でまた3曲引けます。
          </p>
        </div>
      )}

      {phase === "picking" && (
        <div className="flex flex-1 flex-col gap-4 px-4 py-6">
          <p className="text-center text-sm text-gray-500">この3曲から1つ選んでください</p>
          <div className="flex flex-col gap-2.5">
            {candidates.map((song) => (
              <button
                key={song.title}
                onClick={() => choose(song)}
                className="rounded-xl border bg-white p-4 text-left shadow-sm active:bg-orange-50"
              >
                <p className="text-sm font-bold">{song.title}</p>
                <p className="mt-0.5 text-xs text-gray-400">{song.artist}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === "committed" && selected && (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
          <p className="text-xs text-gray-400">歌う曲</p>
          <div>
            <p className="text-2xl font-bold">{selected.title}</p>
            <p className="mt-1 text-sm text-gray-400">{selected.artist}</p>
          </div>
          <p className="rounded-2xl bg-orange-50 px-5 py-3 text-sm font-bold text-orange-600">
            1番は最後まで歌いきってください!
          </p>
          <button onClick={finish} className="w-full rounded-full bg-orange-500 py-3 text-sm font-bold text-white">
            歌い終わった
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

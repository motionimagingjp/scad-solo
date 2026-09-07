"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import AnniversaryBanner from "@/components/AnniversaryBanner";
import { RANK_THRESHOLDS } from "@/lib/data/scadApps";

// 「ソロ活」タブ: ランクと来店ログの管理。
// 来店ログには自分用のメモ(使った金額・誰と会ったか等)を後から書き足せる。
// GET /api/me から実データを取得する(未チェックインなら来店0件の初期値が返る)。

const USER_HEADERS = { "x-user-id": "demo-user" }; // TODO: 認証導入後は共通fetchに移す

type VisitLog = { id: string; spotName: string; comment: string | null; visitedAt: string };

type MeResponse = {
  visitCount: number;
  soloRank: keyof typeof RANK_THRESHOLDS;
  rankLabel: string;
  visitLogs: VisitLog[];
  newAchievements: { key: string; label: string }[];
};

export default function SoloActivityPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const loadMe = () =>
    fetch("/api/me", { headers: USER_HEADERS })
      .then((res) => (res.ok ? res.json() : null))
      .then(setMe)
      .catch(() => setMe(null));

  useEffect(() => {
    loadMe();
  }, []);

  const startEditing = (log: VisitLog) => {
    setEditingId(log.id);
    setDraft(log.comment ?? "");
  };

  const saveMemo = async (logId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/logs/${logId}`, {
        method: "PATCH",
        headers: { ...USER_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ comment: draft }),
      });
      if (res.ok) {
        setEditingId(null);
        await loadMe();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteLog = async (logId: string) => {
    if (!confirm("この来店ログを削除しますか?来店回数にも反映されます。")) return;
    const res = await fetch(`/api/logs/${logId}`, { method: "DELETE", headers: USER_HEADERS });
    if (res.ok) await loadMe();
  };

  if (!me) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
        <header className="border-b bg-white px-4 py-3">
          <h1 className="text-lg font-bold">ソロ活</h1>
        </header>
        <p className="px-4 py-8 text-center text-xs text-gray-400">読み込み中...</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">ソロ活</h1>
      </header>

      {/* ランクサマリー */}
      <section className="bg-white px-4 py-4">
        <p className="text-xs text-gray-400">現在のランク</p>
        <p className="text-xl font-bold text-orange-500">{me.rankLabel}</p>
        <p className="mt-1 text-xs text-gray-400">来店 {me.visitCount} 回</p>
      </section>

      {/* 記念日バナー(未通知の実績があれば表示。表示と同時にAPI側で既読化) */}
      {me.newAchievements.map((a) => (
        <section key={a.key} className="px-4 py-3">
          <AnniversaryBanner milestone={{ count: 0, label: a.label, message: "おめでとう!" }} />
        </section>
      ))}

      {/* 来店ログ一覧 */}
      <section className="mt-2 bg-white px-4 py-4">
        <p className="mb-3 text-sm font-medium">
          来店ログ
          <span className="ml-1 text-xs font-normal text-gray-400">(メモも書けるよ)</span>
        </p>
        {me.visitLogs.length === 0 ? (
          <p className="text-xs text-gray-400">まだ来店ログがありません。お店を決めると記録されます。</p>
        ) : (
          <ul className="space-y-3">
            {me.visitLogs.map((log) => (
              <li key={log.id} className="border-b pb-3 text-sm last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{log.spotName}</p>
                    <p className="text-[11px] text-gray-400">
                      {new Date(log.visitedAt).toLocaleDateString("ja-JP")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => startEditing(log)}
                      aria-label="メモを書く"
                      className="p-1 text-gray-300"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteLog(log.id)}
                      aria-label="この来店ログを削除"
                      className="p-1 text-gray-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {editingId === log.id ? (
                  <div className="mt-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      maxLength={500}
                      placeholder="例: 3500円。〇〇さんと遭遇。日本酒がうまかった"
                      className="w-full rounded-xl border p-2 text-xs"
                    />
                    <div className="mt-1 flex justify-end gap-2">
                      <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-gray-400">
                        キャンセル
                      </button>
                      <button
                        onClick={() => saveMemo(log.id)}
                        disabled={saving}
                        className="rounded-full bg-orange-500 px-4 py-1 text-xs font-bold text-white disabled:opacity-40"
                      >
                        {saving ? "保存中" : "保存"}
                      </button>
                    </div>
                  </div>
                ) : (
                  log.comment && <p className="mt-1 whitespace-pre-wrap text-xs text-gray-600">{log.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <BottomNav />
    </div>
  );
}

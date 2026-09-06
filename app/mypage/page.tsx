import { QrCode } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { SCAD_APPS, ECOSYSTEM_REVEAL_THRESHOLD, RANK_THRESHOLDS } from "@/lib/data/scadApps";
import { prisma } from "@/lib/prisma";

const DEMO_USER_ID = "demo-user"; // TODO: 認証導入後は getUserIdFromRequest 相当の実ユーザーIDに置き換え

// 来店回数などライブのDB値を出すページなので、ビルド時の静的生成(キャッシュ)を禁止する
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const profile = await prisma.userProfile.findUnique({ where: { userId: DEMO_USER_ID } });
  const displayName = profile?.displayName ?? "ゲストユーザー";
  const visitCount = profile?.visitCount ?? 0;
  const rankLabel = profile ? RANK_THRESHOLDS[profile.soloRank].label : RANK_THRESHOLDS.BEGINNER.label;
  const showEcosystem = visitCount >= ECOSYSTEM_REVEAL_THRESHOLD;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      {/* ユーザーマイカード */}
      <section className="bg-white px-4 py-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-orange-100" />
          <div>
            <p className="font-bold">{displayName}</p>
            {/* ランク詳細・来店ログ・スタンプは「ソロ活」タブに集約(重複表示を解消) */}
            <a
              href="/logs"
              className="text-sm text-orange-500 underline underline-offset-2"
            >
              {rankLabel} · 来店{visitCount}件を見る
            </a>
          </div>
        </div>

        {/* ソロ活シェアQR: 行った店・レビューを友達に共有する導線として再定義 */}
        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border py-2 text-sm text-gray-600">
          <QrCode size={16} />
          行きつけの店をシェアするQRを表示
        </button>
      </section>

      {/* App Info: アコーディオンで折りたたみ、初見の情報量を抑える */}
      <section className="mt-2 bg-white px-4 py-4">
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            SCAD-SOLOについて
          </summary>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <p>コンセプト: 1人でも気兼ねなく行ける店を、すぐに見つける。</p>
            <p>バージョン: 1.0.0</p>
            <a href="/terms" className="text-orange-500 underline">
              利用規約
            </a>
          </div>
        </details>
      </section>

      {/* エコシステムセクション: 来店実績が一定数貯まってから表示(離脱防止) */}
      {showEcosystem && (
        <section id="ecosystem" className="mt-2 bg-white px-4 py-4">
          <p className="mb-3 text-xs text-gray-400">
            ✉️ @motion.imaging がおすすめする関連サービス
          </p>
          <div className="space-y-3">
            {SCAD_APPS.filter((app) => !app.isCurrent).map((app) => (
              <a
                key={app.id}
                href={app.url}
                className="block rounded-xl border p-3"
              >
                <p className="text-sm font-bold">{app.name}</p>
                <p className="text-xs text-gray-400">{app.tagline}</p>
                <p className="mt-1 text-xs text-orange-500">{app.benefit}</p>
              </a>
            ))}
          </div>
        </section>
      )}

      <BottomNav />
    </div>
  );
}

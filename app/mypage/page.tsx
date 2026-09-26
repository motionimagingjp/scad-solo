import { QrCode } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import InfoButton from "@/components/InfoButton";
import ShareAppButton from "@/components/ShareAppButton";
import ShareButton from "@/components/ShareButton";
import { SCAD_APPS, ECOSYSTEM_REVEAL_THRESHOLD, RANK_THRESHOLDS } from "@/lib/data/scadApps";
import { prisma } from "@/lib/prisma";
import { BRAND } from "@/lib/brand";
import { auth } from "@/auth";
import { loginWithGoogle, logout } from "@/app/actions/auth";

// 来店回数などライブのDB値を出すページなので、ビルド時の静的生成(キャッシュ)を禁止する
export const dynamic = "force-dynamic";

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";

export default async function MyPage() {
  const session = await auth();
  const loginUserId = session?.user?.id ?? null;
  // 未ログイン時は従来どおり暫定ユーザーID(本番とデモでDBを共有しているため lib/brand.ts で分けている)
  const profileUserId = loginUserId ?? BRAND.userId;

  const [profile, visits, favorites] = await Promise.all([
    prisma.userProfile.findUnique({ where: { userId: profileUserId } }),
    loginUserId
      ? prisma.visit.findMany({
          where: { userId: loginUserId },
          orderBy: { visitedAt: "desc" },
          include: { spot: { select: { name: true, nearestStation: true } } },
        })
      : [],
    loginUserId
      ? prisma.favorite.findMany({
          where: { userId: loginUserId },
          orderBy: { createdAt: "desc" },
          include: { spot: { select: { id: true, name: true, nearestStation: true } } },
        })
      : [],
  ]);

  const uniqueSpotCount = new Set(visits.map((v) => v.spotId)).size;
  const areaCounts = Object.entries(
    visits.reduce<Record<string, number>>((acc, v) => {
      const area = v.spot.nearestStation ?? "エリア未登録";
      acc[area] = (acc[area] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const displayName = profile?.displayName ?? "ゲストユーザー";
  const visitCount = profile?.visitCount ?? 0;
  const rankLabel = profile ? RANK_THRESHOLDS[profile.soloRank].label : RANK_THRESHOLDS.BEGINNER.label;
  const showEcosystem = visitCount >= ECOSYSTEM_REVEAL_THRESHOLD;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-gray-50 pb-16">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">マイページ</h1>
        <div className="flex items-center gap-2">
          <ShareButton />
          <InfoButton />
        </div>
      </header>

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

      {/* ログインと「行った！」「行きたい」の記録 */}
      <section className="mt-2 bg-white px-4 py-4">
        {loginUserId ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">Googleでログイン中</p>
              <form action={logout}>
                <button className="rounded-full border px-4 py-2 text-xs text-gray-500">ログアウト</button>
              </form>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-orange-50 py-3">
                <p className="text-2xl font-bold text-orange-600">{visits.length}</p>
                <p className="text-[11px] text-gray-500">行った！(延べ)</p>
              </div>
              <div className="rounded-xl bg-orange-50 py-3">
                <p className="text-2xl font-bold text-orange-600">{uniqueSpotCount}</p>
                <p className="text-[11px] text-gray-500">行ったお店の数</p>
              </div>
            </div>

            {areaCounts.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500">エリア別</p>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {areaCounts.map(([area, count]) => (
                    <li key={area} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      {area} {count}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500">行きたいリスト</p>
              {favorites.length === 0 ? (
                <p className="mt-1 text-xs text-gray-400">お店の詳細でハートを押すとここに並びます</p>
              ) : (
                <ul className="mt-1 divide-y">
                  {favorites.map((f) => (
                    <li key={f.id}>
                      <a href={`/spot/${f.spot.id}`} className="flex items-center justify-between py-3 text-sm">
                        <span>{f.spot.name}</span>
                        <span className="text-xs text-gray-400">{f.spot.nearestStation ?? ""} ›</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500">行った！履歴</p>
              {visits.length === 0 ? (
                <p className="mt-1 text-xs text-gray-400">お店の詳細で「行った！」を押すと記録されます</p>
              ) : (
                <ul className="mt-1 divide-y">
                  {visits.slice(0, 30).map((v) => (
                    <li key={v.id}>
                      <a href={`/spot/${v.spotId}`} className="flex items-center justify-between py-3 text-sm">
                        <span>{v.spot.name}</span>
                        <span className="text-xs text-gray-400">{v.visitDate.replaceAll("-", "/")}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <form action={loginWithGoogle.bind(null, "/mypage")} className="text-center">
            <p className="text-xs text-gray-500">ログインすると「行きたい」「行った！」を記録できます</p>
            <button className="mt-3 w-full rounded-full border bg-white py-3 text-sm font-bold text-gray-700">
              Googleでログイン
            </button>
          </form>
        )}
      </section>

      {/* App Info: アコーディオンで折りたたみ、初見の情報量を抑える */}
      <section className="mt-2 bg-white px-4 py-4">
        <details>
          <summary className="cursor-pointer text-sm font-medium">
            {BRAND.appName}について
          </summary>
          <div className="mt-2 space-y-1 text-xs text-gray-500">
            <p>コンセプト: 1人でも気兼ねなく行ける店を、すぐに見つける。</p>
            <p>バージョン: 1.0.0</p>
            <a href="/terms" className="text-orange-500 underline">
              利用規約
            </a>
          </div>
        </details>
        <ShareAppButton />
      </section>

      {/* エコシステムセクション: 来店実績が一定数貯まってから表示(離脱防止) */}
      {showEcosystem && (
        <section id="ecosystem" className="mt-2 bg-white px-4 py-4">
          <p className="mb-3 text-xs text-gray-400">{BRAND.ecosystemContact}</p>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import SpotActions from "@/components/SpotActions";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { googleMapsUrl } from "@/lib/geo";
import { jstDateString } from "@/lib/jst";

// ログイン状態・記録をその場で反映するため静的生成しない
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

export default async function SpotDetailPage({ params }: { params: { spotId: string } }) {
  const [spot, session] = await Promise.all([
    prisma.spot.findUnique({ where: { id: params.spotId } }),
    auth(),
  ]);
  if (!spot || spot.status === "CLOSED") notFound();

  const userId = session?.user?.id;
  const [favorite, visitedToday, visitCount] = userId
    ? await Promise.all([
        prisma.favorite.findUnique({ where: { userId_spotId: { userId, spotId: spot.id } } }),
        prisma.visit.findUnique({ where: { userId_spotId_visitDate: { userId, spotId: spot.id, visitDate: jstDateString() } } }),
        prisma.visit.count({ where: { userId, spotId: spot.id } }),
      ])
    : [null, null, 0];

  const meta = [spot.hasCounterSeat && "カウンター席", spot.senberoAvailable && "せんべろ", ...spot.subCategories]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50 pb-20">
      <header className="flex items-center gap-2 border-b bg-white px-4 py-3">
        <Link href="/" className="text-xs text-gray-400">← 戻る</Link>
        <h1 className="truncate text-base font-bold">{spot.name}</h1>
      </header>

      <section className="bg-white px-4 py-5">
        <p className="text-lg font-bold">
          {spot.name}
          {spot.status === "AI_SUGGESTED" && (
            <span className="ml-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-500">AI提案・未確認</span>
          )}
        </p>
        {meta && <p className="mt-1 text-xs text-gray-400">{meta}</p>}
        {spot.tagline && <p className="mt-2 text-sm text-gray-700">{spot.tagline}</p>}
        <p className="mt-2 text-xs text-gray-400">{spot.address}</p>
        {spot.nearestStation && <p className="mt-0.5 text-xs text-gray-400">最寄り: {spot.nearestStation}</p>}
      </section>

      <section className="mt-2 bg-white px-4 py-4">
        <SpotActions
          spotId={spot.id}
          loggedIn={!!userId}
          initialFavorited={!!favorite}
          initialVisitedToday={!!visitedToday}
          initialVisitCount={visitCount}
        />
      </section>

      <section className="mt-2 flex gap-2 bg-white px-4 py-4">
        <Link href={`/checkin/${spot.id}`} className="flex-1 rounded-full bg-black py-3 text-center text-sm font-bold text-white">
          今夜はここにする
        </Link>
        <a
          href={googleMapsUrl(spot)}
          target="_blank"
          rel="noreferrer"
          aria-label="Googleマップで開く"
          className="flex w-12 items-center justify-center rounded-full border text-gray-600"
        >
          <MapPin size={18} />
        </a>
      </section>

      <BottomNav />
    </div>
  );
}

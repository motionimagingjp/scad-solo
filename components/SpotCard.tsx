"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { NAV_HEIGHT } from "@/components/BottomNav";
import { googleMapsUrl } from "@/lib/geo";

// 地図上のピンをタップした時に下からせり上がるカード。
// 「今夜はここにする」を最大サイズのボタンにし、店を決めた瞬間の次の1タップを明確にする。
export type SpotSummary = {
  id: string; name: string; category: string; subCategories: string[];
  hasCounterSeat: boolean; senberoAvailable: boolean; distanceLabel?: string;
  address: string; tagline: string | null;
  latitude: number; longitude: number;
  status?: string; // "AI_SUGGESTED" の場合だけバッジを出す。それ以外(ACTIVE等)は無表示
};

/** AI提案・未確認の店にだけ出す小さいバッジ */
export function AiSuggestedBadge({ status }: { status?: string }) {
  if (status !== "AI_SUGGESTED") return null;
  return (
    <span className="ml-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-500">
      AI提案・未確認
    </span>
  );
}

/** 距離・設備・タグを「徒歩3分 · カウンター席 · せんべろ」の形に整える */
export function spotMetaLine(spot: SpotSummary): string {
  return [
    spot.distanceLabel,
    spot.hasCounterSeat && "カウンター席",
    spot.senberoAvailable && "せんべろ",
    ...spot.subCategories,
  ].filter(Boolean).join(" · ");
}

export default function SpotCard({ spot, onClose }: { spot: SpotSummary; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 z-30 mx-auto max-w-md rounded-t-2xl bg-white p-4 shadow-2xl" style={{ bottom: NAV_HEIGHT }}>
      <button onClick={onClose} className="absolute right-3 top-2 text-xs text-gray-400">閉じる</button>
      <p className="font-bold">
        {spot.name}
        <AiSuggestedBadge status={spot.status} />
      </p>
      <p className="mt-1 text-xs text-gray-400">{spotMetaLine(spot)}</p>
      {spot.tagline && <p className="mt-1 text-xs text-gray-600">{spot.tagline}</p>}
      <p className="mt-1 text-[11px] text-gray-400">{spot.address}</p>

      <div className="mt-3 flex gap-2">
        <Link href={`/checkin/${spot.id}`} className="flex-1 rounded-full bg-orange-500 py-3 text-center text-sm font-bold text-white">
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
      </div>
    </div>
  );
}

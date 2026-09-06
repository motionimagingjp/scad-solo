"use client";

import Link from "next/link";
import { NAV_HEIGHT } from "@/components/BottomNav";

// 地図上のピンをタップした時に下からせり上がるカード。
// 「チェックイン」を最大サイズのボタンにし、店を決めた瞬間の次の1タップを明確にする。
export type SpotSummary = {
  id: string; name: string; category: string; subCategories: string[];
  hasCounterSeat: boolean; senberoAvailable: boolean; distanceLabel?: string;
  latitude: number; longitude: number;
};

export default function SpotCard({ spot, onClose }: { spot: SpotSummary; onClose: () => void }) {
  return (
    <div className="fixed inset-x-0 z-30 mx-auto max-w-md rounded-t-2xl bg-white p-4 shadow-2xl" style={{ bottom: NAV_HEIGHT }}>
      <button onClick={onClose} className="absolute right-3 top-2 text-xs text-gray-400">閉じる</button>
      <p className="font-bold">{spot.name}</p>
      <p className="mt-1 text-xs text-gray-400">
        {spot.distanceLabel ?? ""}{spot.hasCounterSeat && " · カウンター席"}{spot.senberoAvailable && " · せんべろ"}
        {spot.subCategories.length > 0 && ` · ${spot.subCategories.join("・")}`}
      </p>
      <Link href={`/checkin/${spot.id}`} className="mt-3 block rounded-full bg-orange-500 py-3 text-center text-sm font-bold text-white">
        この店に決めてチェックイン
      </Link>
    </div>
  );
}

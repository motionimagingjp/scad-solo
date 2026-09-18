"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Store, MapPin } from "lucide-react";
import BottomNav, { NAV_HEIGHT } from "@/components/BottomNav";
import InfoButton from "@/components/InfoButton";
import LocationChip from "@/components/LocationChip";
import ShareButton from "@/components/ShareButton";
import { AiSuggestedBadge, spotMetaLine, type SpotSummary } from "@/components/SpotCard";
import { distanceLabel, googleMapsUrl, haversineMeters } from "@/lib/geo";
import { useBaseLocation } from "@/lib/useBaseLocation";
import { BRAND } from "@/lib/brand";
import { DEFAULT_SCENE, SCENES, type SceneKey } from "@/lib/data/scenes";

// 「今夜の3軒」: 近い順に絞った3軒をそのまま提示する検索画面。
// シャッフル性は持たせない(エンターテイメント性はゲームタブ側で担うため)。
// 「次の3軒」は距離順プールを先頭から3件ずつページ送りするだけで、乱数は使わない。
//
// シーン(ソロ/デート/グループ)は画面上部で切り替える。ナビのタブは増やさない
// (来店ログ・ランクなどソロ前提の機能の置き場所が分裂するため)。

const PICK_SIZE = 3;
const MAX_REDRAWS = 2; // 「次の3軒」を送れる回数(無制限だと結局「迷う」体験に戻るため)
const POOL_SIZE = 15; // 近い順にこの件数までを候補にする
const MAX_DISTANCE_METERS = 5000; // これより遠い店は「今夜」の範囲外として候補から外す

// 「このエリアにはデータがない」空状態から1タップで実データのあるエリアへ逃がすための固定値
const TOKYO_STATION = { lat: 35.681236, lng: 139.767125, label: "東京駅" };

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageInner />
    </Suspense>
  );
}

// useSearchParams()はSuspense境界を要求する(ビルド時の静的プリレンダリングのため)ので、
// 本体を内側のコンポーネントに分離している
function HomePageInner() {
  const searchParams = useSearchParams();
  const embed = searchParams.get("embed") === "1";
  const { location, setManualLocation, requestGps, gpsDenied } = useBaseLocation();
  const [sceneKey, setSceneKey] = useState<SceneKey>(DEFAULT_SCENE);
  const [modes, setModes] = useState<Set<string>>(new Set());
  const [spots, setSpots] = useState<SpotSummary[] | null>(null);
  const [page, setPage] = useState(0);

  const scene = SCENES.find((s) => s.key === sceneKey) ?? SCENES[0];

  const toggleMode = (mode: string) =>
    setModes((prev) => { const n = new Set(prev); n.has(mode) ? n.delete(mode) : n.add(mode); return n; });

  // シーンごとにモードの選択肢が違うので、切り替えたら絞り込みは解除する
  const selectScene = (key: SceneKey) => {
    setSceneKey(key);
    setModes(new Set());
  };

  // 「今夜の3軒」は飲み屋(SOLO_NOMI)だけを候補にする。
  // サウナやラーメン屋が混ざると体験が壊れるため、大分類でAPI側で絞る。
  // Categoryの名称はソロ前提だが実体は「飲み屋」なので、どのシーンでもSOLO_NOMIを使う。
  useEffect(() => {
    setSpots(null);
    const params = new URLSearchParams({ category: "SOLO_NOMI", scene: sceneKey });
    if (modes.size > 0) params.set("filters", [...modes].join(","));
    fetch(`/api/spots?${params}`)
      .then((res) => (res.ok ? res.json() : { spots: [] }))
      .then((data) => setSpots(data.spots ?? []))
      .catch(() => setSpots([]));
  }, [modes, sceneKey]);

  // 基準地からの近い順。5km圏外の店は「今夜ふらっと」の範囲外として除外する
  // (店が少ないエリアだと無理に遠方を出してしまい、「約28km」のような結果になるため)。
  const pool = useMemo(() => {
    if (!spots || !location) return null;
    return spots
      .map((s) => ({
        spot: s,
        meters: haversineMeters(location, { lat: s.latitude, lng: s.longitude }),
      }))
      .filter(({ meters }) => meters <= MAX_DISTANCE_METERS)
      .sort((a, b) => a.meters - b.meters)
      .slice(0, POOL_SIZE)
      .map(({ spot, meters }) => ({ ...spot, distanceLabel: distanceLabel(meters) }));
  }, [spots, location]);

  // 基準地かモードが変わったら先頭ページに戻す
  useEffect(() => {
    setPage(0);
  }, [pool]);

  const picks = useMemo(
    () => (pool ? pool.slice(page * PICK_SIZE, page * PICK_SIZE + PICK_SIZE) : []),
    [pool, page],
  );

  const showNext = () => {
    if (!pool || page >= MAX_REDRAWS) return;
    if ((page + 1) * PICK_SIZE >= pool.length) return;
    setPage((p) => p + 1);
  };

  const canShowNext = pool !== null && page < MAX_REDRAWS && (page + 1) * PICK_SIZE < pool.length;
  const loading = pool === null;
  // 基準地の問題(近くに無い)ではなく、そのシーンの店がまだ1件も登録されていない状態
  const sceneHasNoData = Boolean(scene.comingSoonNote) && spots?.length === 0;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-gray-50" style={{ paddingBottom: embed ? 16 : NAV_HEIGHT + 16 }}>
      <header className="flex items-center justify-between border-b bg-white px-4 py-3">
        <h1 className="text-base font-bold text-orange-500">{BRAND.appName}</h1>
        <div className="flex items-center gap-2">
          <LocationChip location={location} onSelectManual={setManualLocation} onRequestGps={requestGps} />
          <ShareButton />
          <InfoButton />
        </div>
      </header>

      {/* シーン切替。モードチップ(丸い枠線)と役割が違うことが分かるよう、塗りのセグメントで出す */}
      <div className="mx-4 mt-4 flex rounded-full bg-white p-1 shadow-sm">
        {SCENES.map((s) => (
          <button
            key={s.key}
            onClick={() => selectScene(s.key)}
            aria-pressed={s.key === sceneKey}
            className={`flex-1 rounded-full py-2 text-xs font-bold ${
              s.key === sceneKey ? "bg-orange-500 text-white" : "text-gray-500"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="px-4 pt-5">
        <p className="flex items-center gap-1.5 text-lg font-bold">
          <Store size={20} className="text-orange-500" />
          {scene.heading}
        </p>
        <p className="mt-1 text-xs text-gray-400">現在地は不明の場合は東京駅が出ます</p>
      </div>

      {gpsDenied && location?.source !== "manual" && location?.source !== "gps" && (
        <div className="mx-4 mt-3 rounded-xl bg-orange-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-orange-600">
          位置情報の利用が許可されていないため、東京駅を仮の基準地にしています。
          端末のブラウザ設定で位置情報を許可すると、近くのお店を表示できます。
        </div>
      )}

      {/* 気分のモード。何も選ばなければ「おまかせ」。右端は横スクロールできる合図としてグラデーションを重ねる */}
      <div className="relative mt-3">
        <div className="flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            onClick={() => setModes(new Set())}
            className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
              modes.size === 0 ? "border-orange-400 bg-orange-50 text-orange-600" : "bg-white text-gray-600"
            }`}
          >
            おまかせ
          </button>
          {scene.modes.map((mode) => {
            const on = modes.has(mode);
            return (
              <button
                key={mode}
                onClick={() => toggleMode(mode)}
                className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${
                  on ? "border-orange-400 bg-orange-50 text-orange-600" : "bg-white text-gray-600"
                }`}
              >
                {mode}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-gray-50 to-transparent" />
      </div>

      <div className="space-y-3 px-4 pt-4">
        {loading && <p className="py-10 text-center text-xs text-gray-400">お店を探しています...</p>}

        {!loading && picks.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl bg-white p-6 text-center">
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: "url(/images/bar-mood.jpg)" }}
            />
            {/* 「絞りすぎ」「シーンのデータがまだ無い」「この周辺に無い」で案内も逃し先も変える */}
            <div className="relative">
              {modes.size > 0 ? (
                <>
                  <p className="text-sm text-gray-500">条件に合うお店が見つかりませんでした</p>
                  <p className="mt-2 text-xs text-gray-400">モードを減らすか、別のエリアを試してみてください</p>
                </>
              ) : sceneHasNoData ? (
                <>
                  <p className="text-sm text-gray-500">{scene.comingSoonNote}</p>
                  <p className="mt-2 text-xs text-gray-400">お店の登録が進むとここに表示されます</p>
                  <button
                    onClick={() => selectScene(DEFAULT_SCENE)}
                    className="mt-4 rounded-full border border-orange-400 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-600"
                  >
                    ソロで探す
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">この周辺にはまだ登録されたお店がありません</p>
                  <p className="mt-2 text-xs text-gray-400">上の場所ボタンから、別のエリアを指定してみてください</p>
                  <button
                    onClick={() => setManualLocation(TOKYO_STATION)}
                    className="mt-4 rounded-full border border-orange-400 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-600"
                  >
                    東京駅エリアを見る
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {picks.map((spot) => (
          <div key={spot.id} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-bold">
              {spot.name}
              <AiSuggestedBadge status={spot.status} />
            </p>
            <p className="mt-1 text-xs text-gray-400">{spotMetaLine(spot)}</p>
            {spot.tagline && <p className="mt-1 text-xs text-gray-600">{spot.tagline}</p>}
            <p className="mt-1 text-[11px] text-gray-400">{spot.address}</p>

            <div className="mt-3 flex gap-2">
              <Link
                href={`/checkin/${spot.id}`}
                className="flex-1 rounded-full bg-orange-500 py-3 text-center text-sm font-bold text-white"
              >
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
        ))}
      </div>

      {picks.length > 0 && (
        <div className="px-4 pt-4">
          <button
            onClick={showNext}
            disabled={!canShowNext}
            className="flex w-full items-center justify-center gap-2 rounded-full border bg-white py-3 text-sm font-medium text-gray-700 disabled:opacity-40"
          >
            <Store size={16} />
            {canShowNext ? `次の3軒 (あと${MAX_REDRAWS - page}回)` : "これ以上近くのお店はありません"}
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}

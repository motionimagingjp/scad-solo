"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import type { SpotSummary } from "@/components/SpotCard";

// 東京駅周辺(現在地が取得できない場合のフォールバック中心地)
const FALLBACK_CENTER = { lat: 35.681236, lng: 139.767125 };

export default function SearchMap({
  spots,
  userLocation,
  onSelectSpot,
}: {
  spots: SpotSummary[];
  userLocation: { lat: number; lng: number } | null;
  onSelectSpot: (spot: SpotSummary) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [loadError, setLoadError] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 地図の初期化(1回だけ)
  useEffect(() => {
    if (!apiKey || !containerRef.current) return;
    let cancelled = false;

    loadGoogleMaps(apiKey)
      .then((google) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: userLocation ?? FALLBACK_CENTER,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
        });
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // 現在地が後から取れた場合に中心を合わせる
  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setCenter(userLocation);
    }
  }, [userLocation]);

  // 店舗ピンの描画(検索結果が変わるたびに張り替え)
  useEffect(() => {
    if (!apiKey) return;
    loadGoogleMaps(apiKey)
      .then((google) => {
        if (!mapRef.current) return;

        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = spots.map((spot) => {
          const marker = new google.maps.Marker({
            position: { lat: spot.latitude, lng: spot.longitude },
            map: mapRef.current,
            title: spot.name,
          });
          marker.addListener("click", () => onSelectSpot(spot));
          return marker;
        });
      })
      .catch(() => setLoadError(true));
  }, [spots, apiKey, onSelectSpot]);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-200 px-6 text-center text-xs text-gray-500">
        地図を表示するにはGoogle Maps APIキーの設定が必要です
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-200 px-6 text-center text-xs text-gray-500">
        地図の読み込みに失敗しました。通信環境を確認して再読み込みしてください。
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}

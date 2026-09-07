"use client";

import { useCallback, useEffect, useState } from "react";

// 「どのエリアの店を出すか」の基準地。提案結果そのものを左右するため、
// 手動指定 > 位置情報 > IP推定 > 既定値 の優先順で決め、画面には常に基準地を表示する。

export type LocationSource = "manual" | "gps" | "ip" | "default";

export type BaseLocation = {
  lat: number;
  lng: number;
  label: string;
  source: LocationSource;
};

const STORAGE_KEY = "scad-solo:base-location";

// 位置情報もIP推定も使えない場合の最終フォールバック。
// 東京駅を起点にすると5km圏内に新橋・秋葉原・水道橋の実データがあり、
// 初見(出張者・観光客含む)でも結果が空にならない
const DEFAULT_LOCATION: BaseLocation = {
  lat: 35.681236,
  lng: 139.767125,
  label: "東京駅",
  source: "default",
};

function readStoredLocation(): BaseLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.lat !== "number" || typeof parsed?.lng !== "number") return null;
    return { lat: parsed.lat, lng: parsed.lng, label: parsed.label ?? "指定した場所", source: "manual" };
  } catch {
    return null;
  }
}

export function useBaseLocation() {
  const [location, setLocation] = useState<BaseLocation | null>(null);

  const resolveFromIp = useCallback(() => {
    return fetch("/api/location")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (typeof data?.lat === "number" && typeof data?.lng === "number") {
          setLocation({ lat: data.lat, lng: data.lng, label: data.label ?? "現在のエリア", source: "ip" });
        } else {
          setLocation(DEFAULT_LOCATION);
        }
      })
      .catch(() => setLocation(DEFAULT_LOCATION));
  }, []);

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      resolveFromIp();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "現在地", source: "gps" });
      },
      () => resolveFromIp(),
      { timeout: 8000 },
    );
  }, [resolveFromIp]);

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) {
      setLocation(stored);
      return;
    }
    requestGps();
  }, [requestGps]);

  const setManualLocation = useCallback((next: { lat: number; lng: number; label: string }) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
    setLocation({ ...next, source: "manual" });
  }, []);

  return { location, setManualLocation, requestGps };
}

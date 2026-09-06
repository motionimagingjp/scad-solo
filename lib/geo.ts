export type LatLng = { lat: number; lng: number };

/** 2点間の距離(メートル)。Haversine公式 */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * 距離ラベル。徒歩圏(約20分=1.6km)までは「徒歩n分」、それ以上は「約n.nkm」。
 * 遠い店に「徒歩300分」と出すと壊れて見えるため、表記を切り替える。
 */
export function distanceLabel(meters: number): string {
  if (meters <= 1600) return `徒歩${Math.max(1, Math.round(meters / 80))}分`;
  return `約${(meters / 1000).toFixed(1)}km`;
}

/**
 * Googleマップで開くURL。店名ではなく座標で開く。
 * 店名検索だと同名の別店舗に飛ぶことがあるが、座標なら必ずその場所を指す。
 */
export function googleMapsUrl(spot: { name: string; latitude: number; longitude: number }): string {
  const query = encodeURIComponent(`${spot.latitude},${spot.longitude}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

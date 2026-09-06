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

/** 徒歩分速80mで概算した「徒歩n分」ラベル */
export function walkMinutesLabel(meters: number): string {
  const minutes = Math.max(1, Math.round(meters / 80));
  return `徒歩${minutes}分`;
}

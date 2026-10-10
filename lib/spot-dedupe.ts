// 同じ店が別Spotとして登録されていても、画面には1件だけ出すための正規化。
// 全角/半角・大文字小文字・空白・ハイフン類の表記ゆれを吸収する。

const DASHES = /[‐-―−ー－-]/g;

export function normalizeText(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(DASHES, "-")
    .replace(/[\s　]+/g, "")
    .replace(/丁目/g, "-")
    .replace(/番地?/g, "-")
    .replace(/号/g, "")
    .replace(/-+/g, "-")
    .replace(/-$/, "");
}

export function spotKey(name: string, address: string): string {
  return `${normalizeText(name)}\u0000${normalizeText(address)}`;
}

// 店名が同じで座標が近い(約100m以内)ものは同一店舗とみなす。
// 先に並んだ方を残すので、近い順に並べた後に呼ぶと近い方が残る。
export function dedupeByNameAndPlace<T extends { name: string; latitude: number; longitude: number }>(
  items: T[],
  thresholdMeters = 100,
): T[] {
  const kept = new Map<string, T[]>();
  const out: T[] = [];
  for (const item of items) {
    const key = normalizeText(item.name);
    const same = kept.get(key) ?? [];
    const dup = same.some((o) => approxMeters(o, item) <= thresholdMeters);
    if (dup) continue;
    same.push(item);
    kept.set(key, same);
    out.push(item);
  }
  return out;
}

function approxMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const dLat = (a.latitude - b.latitude) * 111_000;
  const dLng = (a.longitude - b.longitude) * 111_000 * Math.cos((a.latitude * Math.PI) / 180);
  return Math.hypot(dLat, dLng);
}

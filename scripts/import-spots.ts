// AI検索や手作業で集めた候補店舗(JSON)をDBへ一括インポートするスクリプト。
// 実行例: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-spots.ts data/spots-shibuya.json
//
// 入力JSONは候補店舗の配列。1件のフォーマットは types/SpotCandidate を参照。
// 住所は Google Geocoding API で緯度経度に変換する(GOOGLE_SERVER_API_KEY が必要。
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY はブラウザ用のHTTPリファラー制限キーなのでサーバーからは使えない)。
//
// 同じ店を再インポートしても重複登録しないよう、name+address の完全一致で既存レコードを探し、
// あれば更新、なければ新規作成する(AND検索の絞り込みタグと違い、ここは緩い突合で十分)。

import { PrismaClient, Category } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

type SpotCandidate = {
  name: string;
  address: string;
  nearestStation: string;
  category?: Category; // 省略時は SOLO_NOMI
  tagline?: string;
  subCategories?: string[];
  hasCounterSeat?: boolean;
  senberoAvailable?: boolean;
  soloFriendliness?: number;
  sourceNote?: string; // 発見した検索クエリやURLなど
};

async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.GOOGLE_SERVER_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_SERVER_API_KEY が未設定です(サーバー用の非公開キーが必要)");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const loc = data?.results?.[0]?.geometry?.location;
  if (!loc) {
    console.warn(`  ⚠ ジオコーディング失敗: ${address} (status=${data?.status})`);
    return null;
  }
  return { lat: loc.lat, lng: loc.lng };
}

async function importOne(candidate: SpotCandidate) {
  const coords = await geocode(candidate.address);
  if (!coords) return { ok: false, name: candidate.name };

  const existing = await prisma.spot.findFirst({
    where: { name: candidate.name, address: candidate.address },
  });

  const data = {
    name: candidate.name,
    category: candidate.category ?? Category.SOLO_NOMI,
    address: candidate.address,
    tagline: candidate.tagline,
    subCategories: candidate.subCategories ?? [],
    hasCounterSeat: candidate.hasCounterSeat ?? true,
    senberoAvailable: candidate.senberoAvailable ?? false,
    soloFriendliness: candidate.soloFriendliness ?? 5,
    latitude: coords.lat,
    longitude: coords.lng,
    nearestStation: candidate.nearestStation,
    sourceNote: candidate.sourceNote,
  };

  if (existing) {
    await prisma.spot.update({ where: { id: existing.id }, data });
    return { ok: true, name: candidate.name, action: "updated" as const };
  }
  await prisma.spot.create({ data });
  return { ok: true, name: candidate.name, action: "created" as const };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("使い方: ts-node scripts/import-spots.ts <candidates.json>");
    process.exit(1);
  }

  const candidates: SpotCandidate[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`${candidates.length}件を処理します...`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const result = await importOne(candidate);
    if (!result.ok) {
      failed++;
      continue;
    }
    if (result.action === "created") created++;
    else updated++;
    console.log(`  ✓ ${result.action === "created" ? "新規" : "更新"}: ${candidate.name}`);
  }

  console.log(`完了: 新規${created}件 / 更新${updated}件 / 失敗${failed}件`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// デート・グループ(将来ソロも同形式で追加可)向けに新規収集した候補店舗を取り込むスクリプト。
// 実行例: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-scene-candidates.ts data/scene-candidates-yotsuya.json
//
// 既存の scripts/import-spots.ts(ソロ専用・駅ごとの一括投入)とは別に用意した。
// こちらは1件の候補が複数シーンに同時登録できる点が違う
// (例: 同じ店が DATE と GROUP の両方の候補になる、SOLO と DATE の組み合わせ、など)。
// JSON形式・検索クエリの方針は FLOW.md の「新規収集(デート/グループ)」を参照。
//
// 店舗の重複判定は既存スクリプトと同じ name+address の完全一致。既存店がヒットしたら
// 座席・予約などの属性を上書きし、シーンはSpotSceneにspotId+sceneでupsertする
// (1回の実行で複数駅・複数シーンを混在させても、SpotSceneは行が増えるだけで安全)。
//
// GROUPシーンは「テーブル席を実際に確認できた店」だけを検索に出す設計(FLOW.md参照)。
// そのため hasTableSeat が true でない候補に scene:"GROUP" を付けることはできない
// (誤って未確認のままグループ検索に出てしまうことを防ぐため、ここで弾く)。

import { PrismaClient, Category, Scene } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

type SceneEntry = {
  scene: "SOLO" | "DATE" | "GROUP";
  score: number; // 1-10。収集時点の確信度(店の実在・条件確認は済んでいる前提)
  reason: string; // なぜこのシーンに合うか(一言。表示はしないが後で見直す時の手掛かりにする)
  budgetMin?: number; // 1人あたり予算(円)
  budgetMax?: number;
};

type SceneCandidate = {
  name: string;
  address: string;
  nearestStation: string;
  category?: Category; // 省略時は SOLO_NOMI
  tagline?: string;
  subCategories?: string[];
  hasCounterSeat?: boolean;
  hasTableSeat?: boolean;
  hasPrivateRoom?: boolean;
  acceptsReservation?: boolean;
  senberoAvailable?: boolean;
  maxGroupSize?: number; // 実際に入れる人数の目安(グループは2-4名を想定)
  sourceNote?: string; // 検索クエリ・出典URLなど
  scenes: SceneEntry[]; // 1件で複数シーンを同時に登録できる
};

async function geocode(
  address: string,
): Promise<{ lat: number; lng: number; placeId: string | null } | null> {
  const apiKey = process.env.GOOGLE_SERVER_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_SERVER_API_KEY が未設定です(サーバー用の非公開キーが必要)");

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const result = data?.results?.[0];
  const loc = result?.geometry?.location;
  if (!loc) {
    console.warn(`  ⚠ ジオコーディング失敗: ${address} (status=${data?.status})`);
    return null;
  }
  return { lat: loc.lat, lng: loc.lng, placeId: result.place_id ?? null };
}

async function importOne(candidate: SceneCandidate) {
  const groupEntry = candidate.scenes.find((s) => s.scene === "GROUP");
  if (groupEntry && candidate.hasTableSeat !== true) {
    return {
      ok: false,
      name: candidate.name,
      error: "GROUPシーンにはhasTableSeat:trueが必須です(テーブル席未確認の店をグループ検索に出さないため)",
    };
  }

  const coords = await geocode(candidate.address);
  if (!coords) return { ok: false, name: candidate.name, error: "ジオコーディング失敗" };

  const existing = await prisma.spot.findFirst({
    where: { name: candidate.name, address: candidate.address },
  });

  const soloEntry = candidate.scenes.find((s) => s.scene === "SOLO");

  const data = {
    name: candidate.name,
    category: candidate.category ?? Category.SOLO_NOMI,
    address: candidate.address,
    tagline: candidate.tagline,
    subCategories: candidate.subCategories ?? [],
    hasCounterSeat: candidate.hasCounterSeat ?? true,
    hasTableSeat: candidate.hasTableSeat,
    hasPrivateRoom: candidate.hasPrivateRoom,
    acceptsReservation: candidate.acceptsReservation,
    senberoAvailable: candidate.senberoAvailable ?? false,
    maxGroupSize: candidate.maxGroupSize,
    // soloFriendlinessはSpotの必須フィールド(既定5)。SOLOシーンのスコアがあれば同期する
    ...(soloEntry ? { soloFriendliness: soloEntry.score } : {}),
    latitude: coords.lat,
    longitude: coords.lng,
    nearestStation: candidate.nearestStation,
    sourceNote: candidate.sourceNote,
    geocodePlaceId: coords.placeId,
    geocodedAt: new Date(),
    // テーブル席を確認済みでGROUPに登録する候補だけ、確認日時を入れて検索に出す
    ...(groupEntry ? { groupInfoVerifiedAt: new Date() } : {}),
  };

  const spot = existing
    ? await prisma.spot.update({ where: { id: existing.id }, data })
    : await prisma.spot.create({ data });

  for (const entry of candidate.scenes) {
    await prisma.spotScene.upsert({
      where: { spotId_scene: { spotId: spot.id, scene: entry.scene as Scene } },
      update: {
        score: entry.score,
        reason: entry.reason,
        budgetMin: entry.budgetMin,
        budgetMax: entry.budgetMax,
        verifiedAt: new Date(),
      },
      create: {
        spotId: spot.id,
        scene: entry.scene as Scene,
        score: entry.score,
        reason: entry.reason,
        budgetMin: entry.budgetMin,
        budgetMax: entry.budgetMax,
        verifiedAt: new Date(),
      },
    });
  }

  return {
    ok: true,
    name: candidate.name,
    action: existing ? ("updated" as const) : ("created" as const),
    scenes: candidate.scenes.map((s) => s.scene),
  };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("使い方: ts-node scripts/import-scene-candidates.ts <candidates.json>");
    process.exit(1);
  }

  const candidates: SceneCandidate[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`${candidates.length}件を処理します...`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const result = await importOne(candidate);
    if (!result.ok) {
      failed++;
      console.log(`  ✗ ${candidate.name}: ${result.error}`);
      continue;
    }
    if (result.action === "created") created++;
    else updated++;
    console.log(`  ✓ ${result.action === "created" ? "新規" : "更新"}: ${candidate.name} [${result.scenes!.join(",")}]`);
  }

  console.log(`完了: 新規${created}件 / 更新${updated}件 / 失敗${failed}件`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

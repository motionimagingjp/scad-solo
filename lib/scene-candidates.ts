// デート・グループ(将来ソロも同形式で追加可)向けに新規収集した候補店舗を
// Spot + SpotScene に取り込む共通ロジック。scripts/import-scene-candidates.ts(ローカル実行用)と
// app/api/admin/import-scene-candidates/route.ts(本番投入用)の両方から使う。
// 一箇所にまとめているのは、ロジックが二重管理でズレて本番だけ挙動が違う事故を防ぐため。
//
// 1件の候補が複数シーンに同時登録できる(例: 同じ店が DATE と GROUP の両方の候補になる、
// SOLO と DATE の組み合わせ、など)。JSON形式・検索クエリの方針は
// FLOW.md の「新規収集(デート/グループ)」を参照。
//
// 店舗の重複判定は scripts/import-spots.ts と同じ name+address の完全一致。既存店が
// ヒットしたら座席・予約などの属性を上書きし、シーンはSpotSceneにspotId+sceneでupsertする。
//
// GROUPシーンは「テーブル席を実際に確認できた店」だけを検索に出す設計(FLOW.md参照)。
// そのため hasTableSeat が true でない候補に scene:"GROUP" を付けることはできない
// (誤って未確認のままグループ検索に出てしまうことを防ぐため、ここで弾く)。

import { PrismaClient, Category, Scene } from "@prisma/client";

export type SceneEntry = {
  scene: "SOLO" | "DATE" | "GROUP";
  score: number; // 1-10。収集時点の確信度(店の実在・条件確認は済んでいる前提)
  reason: string; // なぜこのシーンに合うか(一言。表示はしないが後で見直す時の手掛かりにする)
  budgetMin?: number; // 1人あたり予算(円)
  budgetMax?: number;
};

export type SceneCandidate = {
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

export type ImportResult =
  | { ok: true; name: string; action: "created" | "updated"; scenes: string[] }
  | { ok: false; name: string; error: string };

type GeocodeResult = { ok: true; lat: number; lng: number; placeId: string | null } | { ok: false; status: string; message?: string };

async function geocode(address: string, apiKey: string): Promise<GeocodeResult> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const result = data?.results?.[0];
  const loc = result?.geometry?.location;
  if (loc) return { ok: true, lat: loc.lat, lng: loc.lng, placeId: result.place_id ?? null };
  // status(REQUEST_DENIED等)とerror_messageをそのまま返し、失敗原因を呼び出し元でわかるようにする
  return { ok: false, status: data?.status ?? `HTTP_${res.status}`, message: data?.error_message };
}

export async function importSceneCandidate(
  prisma: PrismaClient,
  candidate: SceneCandidate,
  apiKey: string,
): Promise<ImportResult> {
  const groupEntry = candidate.scenes.find((s) => s.scene === "GROUP");
  if (groupEntry && candidate.hasTableSeat !== true) {
    return {
      ok: false,
      name: candidate.name,
      error: "GROUPシーンにはhasTableSeat:trueが必須です(テーブル席未確認の店をグループ検索に出さないため)",
    };
  }

  const geo = await geocode(candidate.address, apiKey);
  if (!geo.ok) {
    return { ok: false, name: candidate.name, error: `ジオコーディング失敗: ${geo.status}${geo.message ? ` (${geo.message})` : ""}` };
  }

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
    latitude: geo.lat,
    longitude: geo.lng,
    nearestStation: candidate.nearestStation,
    sourceNote: candidate.sourceNote,
    geocodePlaceId: geo.placeId,
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
    action: existing ? "updated" : "created",
    scenes: candidate.scenes.map((s) => s.scene),
  };
}

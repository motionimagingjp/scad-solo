import { NextRequest, NextResponse } from "next/server";
import { Category, Scene, SpotStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// 「さがす」画面用の検索API。
// カウンター席・せんべろ・個室などはSpotの専用フィールド、それ以外の条件(立ち飲み・日本酒・
// ワイン・カラオケ等)は subCategories のタグとして扱う。
// UIに出すフィルターは必ずここで実際に効くものだけにする(押しても効かない飾りを作らない)。
// category を指定すると大分類で絞る(「今夜の3軒」は SOLO_NOMI だけを対象にする)。
// scene を指定するとシーン別スコア(SpotScene)で絞る。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";

const FIELD_FILTERS: Record<
  string,
  | "hasCounterSeat"
  | "senberoAvailable"
  | "hasTableSeat"
  | "acceptsReservation"
  | "hasPrivateRoom"
  | "hasAllYouCanDrink"
  | "hasCourse"
  | "canCharter"
> = {
  "カウンター席": "hasCounterSeat",
  "せんべろ": "senberoAvailable",
  "テーブル席": "hasTableSeat",
  "予約可": "acceptsReservation",
  "個室": "hasPrivateRoom",
  "飲み放題": "hasAllYouCanDrink",
  "コース": "hasCourse",
  "貸切": "canCharter",
};

const CATEGORIES = new Set<string>(Object.values(Category));
const SCENES = new Set<string>(Object.values(Scene));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filters = (searchParams.get("filters") ?? "").split(",").filter(Boolean);
  const category = searchParams.get("category");
  const scene = searchParams.get("scene");

  // ACTIVE(人力確認済み)に加え、AI_SUGGESTED(Geminiのオンデマンド検索で
  // 見つけた未確認データ)も出す。ただしバッジで区別できるようstatusを返す。
  // NEEDS_REVIEW(閉店確認バッチで怪しいと判定)・CLOSEDは引き続き除外
  const where: Record<string, unknown> = { status: { in: [SpotStatus.ACTIVE, SpotStatus.AI_SUGGESTED] } };
  const tagFilters: string[] = [];

  if (category && CATEGORIES.has(category)) where.category = category;

  // SOLOは既存のソロ機能(Spot.soloFriendliness)と並行稼働中で、SpotSceneに行が無い店も
  // 出す必要があるため絞り込まない。それ以外のシーンはSpotSceneに行がある店だけを対象にする。
  if (scene && scene !== Scene.SOLO && SCENES.has(scene)) {
    where.scenes = { some: { scene } };
    // グループは人数・個室などの属性を実際に確認できた店だけを出す(未確認=nullは出さない)
    if (scene === Scene.GROUP) where.groupInfoVerifiedAt = { not: null };
  }

  for (const filter of filters) {
    const field = FIELD_FILTERS[filter];
    if (field) where[field] = true;
    else tagFilters.push(filter);
  }
  if (tagFilters.length > 0) where.subCategories = { hasEvery: tagFilters };

  // 「近い順」の絞り込みはクライアント側(座標がここには来ない)で行うため、
  // ここで件数を絞ると「たまたまDBの先頭にある店」だけが対象になり、検索場所に
  // 関係なく同じ一部の店ばかり出てしまう(take:50・orderBy無しで実際に発生した不具合)。
  // 店舗が662件まで増えて上限500に達していたため引き上げた。
  // ただし全件をクライアントに返す構造自体が件数に耐えないので、計画通り数千件まで
  // 増やすなら基準地をAPIに渡してDB側で距離を絞る作りに変える必要がある。
  const spots = await prisma.spot.findMany({ where, take: 5000 });

  return NextResponse.json({
    spots: spots.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      subCategories: s.subCategories,
      hasCounterSeat: s.hasCounterSeat,
      senberoAvailable: s.senberoAvailable,
      address: s.address,
      tagline: s.tagline,
      latitude: s.latitude,
      longitude: s.longitude,
      status: s.status,
    })),
  });
}

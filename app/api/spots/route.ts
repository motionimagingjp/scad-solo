import { NextRequest, NextResponse } from "next/server";
import { Category } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// 「さがす」画面用の検索API。
// カウンター席・せんべろはSpotの専用フィールド、それ以外の条件(立ち飲み・日本酒・
// ワイン・カラオケ等)は subCategories のタグとして扱う。
// UIに出すフィルターは必ずここで実際に効くものだけにする(押しても効かない飾りを作らない)。
// category を指定すると大分類で絞る(ソロ飲みルーレットは SOLO_NOMI だけを対象にする)。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";

const FIELD_FILTERS: Record<string, "hasCounterSeat" | "senberoAvailable"> = {
  "カウンター席": "hasCounterSeat",
  "せんべろ": "senberoAvailable",
};

const CATEGORIES = new Set<string>(Object.values(Category));

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filters = (searchParams.get("filters") ?? "").split(",").filter(Boolean);
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  const tagFilters: string[] = [];

  if (category && CATEGORIES.has(category)) where.category = category;

  for (const filter of filters) {
    const field = FIELD_FILTERS[filter];
    if (field) where[field] = true;
    else tagFilters.push(filter);
  }
  if (tagFilters.length > 0) where.subCategories = { hasEvery: tagFilters };

  const spots = await prisma.spot.findMany({ where, take: 50 });

  return NextResponse.json({
    spots: spots.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      subCategories: s.subCategories,
      hasCounterSeat: s.hasCounterSeat,
      senberoAvailable: s.senberoAvailable,
      latitude: s.latitude,
      longitude: s.longitude,
    })),
  });
}

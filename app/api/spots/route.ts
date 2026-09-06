import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 「さがす」画面用の検索API。
// 現状マッピングできるフィルターのみDBクエリに反映する(相席なし・今すぐ入れる・イベントは
// 対応するフィールドが未設計のため、指定されても現状は無視される)。

const SUBCATEGORY_FILTERS = ["カラオケ", "サウナ"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filters = (searchParams.get("filters") ?? "").split(",").filter(Boolean);

  const where: Record<string, unknown> = {};
  if (filters.includes("カウンター席")) where.hasCounterSeat = true;
  if (filters.includes("せんべろ")) where.senberoAvailable = true;

  const subCategoryFilters = filters.filter((f) => SUBCATEGORY_FILTERS.includes(f));
  if (subCategoryFilters.length > 0) where.subCategories = { hasSome: subCategoryFilters };

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

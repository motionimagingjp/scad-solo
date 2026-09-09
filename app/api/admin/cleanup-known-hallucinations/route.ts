import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Phase 0・Phase 1のデータ収集で繰り返し確認された「店名使い回し」パターン
// (駅名だけ差し替えて複数駅に同じテンプレ店名が出現=ハルシネーションの一種)を
// 一括削除するための一回限りの掃除用エンドポイント。
//
// 該当パターン(2026-09時点で判明分): 魚金・魚菜割烹魚市・日本酒スタンド蔵元屋・
// イタリアンバール イル・ソーレ・昭和大衆酒場・手打蕎麦満留賀・カドクラ・
// 常陸野ブルーイング(全国チェーンのため方針上除外)。
// 削除後は /api/admin/ai-search-spots?station=<駅名> で各駅ぶんAI提案を
// 集め直す想定(AI_SUGGESTEDバッジ付きで出るので、確定前にレビューできる)。

export const preferredRegion = "sin1";

const BAD_NAME_PATTERNS = [
  /魚金/,
  /魚菜.*割烹.*魚市/,
  /蔵元屋/,
  /イル・ソーレ/,
  /昭和大衆酒場/,
  /満留賀/,
  /カドクラ/,
  /常陸野ブルーイング/,
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const authorized = auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dryRun = searchParams.get("dry") === "1";

  const all = await prisma.spot.findMany({ select: { id: true, name: true, address: true, nearestStation: true } });
  const matched = all.filter((s) => BAD_NAME_PATTERNS.some((re) => re.test(s.name)));

  if (!dryRun && matched.length > 0) {
    await prisma.spot.deleteMany({ where: { id: { in: matched.map((s) => s.id) } } });
  }

  const affectedStations = [...new Set(matched.map((s) => s.nearestStation).filter(Boolean))];

  return NextResponse.json({
    dryRun,
    deletedCount: dryRun ? 0 : matched.length,
    matched: matched.map((s) => ({ name: s.name, address: s.address, nearestStation: s.nearestStation })),
    affectedStations,
    nextStep: dryRun
      ? "問題なければ ?dry=1 を外して再度呼んでください(実際に削除されます)"
      : `各駅ごとに /api/admin/ai-search-spots?station=<駅名>&secret=... を叩いて代替候補を検索してください。対象: ${affectedStations.join("、")}`,
  });
}

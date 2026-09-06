import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { RANK_THRESHOLDS } from "@/lib/data/scadApps";
import { calcRank, detectVisitMilestones, detectRegularBadge } from "@/lib/rank";
import { pickStampDesign, buildThreadsSharePayload } from "@/lib/stamps";
import { pickActivities } from "@/lib/data/activities";

// 純粋なJSON API。Next.jsの画面状態には一切依存せず、SwiftUIからも同じレスポンスをそのまま使える。

// DB(Neon)はシンガポールにあり、この処理は1回の記録で8回ほどDBと往復する。
// 既定の米国東部で動かすと往復ごとに太平洋を越えるため、DBと同じリージョンに寄せる。
export const preferredRegion = "sin1";

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotId, comment, imageUrl } = await req.json();
  if (!spotId) return NextResponse.json({ error: "spotId is required" }, { status: 400 });

  const spot = await prisma.spot.findUnique({ where: { id: spotId } });
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });

  await prisma.userProfile.upsert({
    where: { userId },
    update: {},
    create: { userId, displayName: "ゲストユーザー" },
  });

  // 来店ログ・カウント・スタンプをまとめて確定
  const { visitLog, user, visitsAtSpot } = await prisma.$transaction(async (tx) => {
    const visitLog = await tx.visitLog.create({ data: { userId, spotId, comment, imageUrl } });
    const user = await tx.userProfile.update({ where: { userId }, data: { visitCount: { increment: 1 } } });
    const stamp = pickStampDesign(visitLog.id);
    await tx.stamp.create({ data: { userId, visitLogId: visitLog.id, designId: stamp.id } });
    const visitsAtSpot = await tx.visitLog.count({ where: { userId, spotId } });
    return { visitLog, user, visitsAtSpot };
  });

  const newRank = calcRank(user.visitCount);
  if (newRank !== user.soloRank) {
    await prisma.userProfile.update({ where: { userId }, data: { soloRank: newRank } });
  }

  // 実績判定(来店数記念日 + 常連バッジ)。既存キーは除外して二重付与を防ぐ
  const achieved = new Set((await prisma.userAchievement.findMany({ where: { userId }, select: { key: true } })).map((a) => a.key));
  const newAchievements = [
    ...detectVisitMilestones(user.visitCount, achieved),
    detectRegularBadge(spot.id, spot.name, visitsAtSpot, achieved),
  ].filter((a): a is NonNullable<typeof a> => a !== null);

  if (newAchievements.length) {
    await prisma.userAchievement.createMany({
      data: newAchievements.map((a) => ({ userId, key: a.key, label: a.label })),
      skipDuplicates: true,
    });
  }

  const stamp = pickStampDesign(visitLog.id);

  return NextResponse.json({
    log: { id: visitLog.id, spotId, comment, imageUrl, visitedAt: visitLog.visitedAt },
    spot: { id: spot.id, name: spot.name, category: spot.category, subCategories: spot.subCategories },
    visitCount: user.visitCount,
    soloRank: newRank,
    rankLabel: RANK_THRESHOLDS[newRank].label,
    stamp,
    newAchievements,                 // バナー表示対象。空配列なら何も出さない
    activities: pickActivities(spot.category, spot.subCategories), // チェックイン画面に出すアクティビティ
    share: buildThreadsSharePayload({ spotName: spot.name, stamp }),
  });
}

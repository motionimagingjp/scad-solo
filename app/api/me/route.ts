import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { RANK_THRESHOLDS } from "@/lib/data/scadApps";

// ソロ活タブ・マイページ用の集約API。POST /api/logs で書き込んだ実データを返す。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.userProfile.findUnique({ where: { userId } });
  if (!user) {
    return NextResponse.json({
      displayName: null,
      visitCount: 0,
      soloRank: "BEGINNER" as const,
      rankLabel: RANK_THRESHOLDS.BEGINNER.label,
      visitLogs: [],
      newAchievements: [],
    });
  }

  const [visitLogs, unnotified] = await Promise.all([
    prisma.visitLog.findMany({
      where: { userId },
      orderBy: { visitedAt: "desc" },
      take: 20,
      include: { spot: { select: { name: true } } },
    }),
    prisma.userAchievement.findMany({ where: { userId, notified: false } }),
  ]);

  // バナー表示は一度きり。取得と同時に既読化する(再訪問時は出さない)
  if (unnotified.length) {
    await prisma.userAchievement.updateMany({
      where: { userId, key: { in: unnotified.map((a) => a.key) } },
      data: { notified: true },
    });
  }

  return NextResponse.json({
    displayName: user.displayName,
    visitCount: user.visitCount,
    soloRank: user.soloRank,
    rankLabel: RANK_THRESHOLDS[user.soloRank].label,
    visitLogs: visitLogs.map((v) => ({
      id: v.id,
      spotName: v.spot.name,
      comment: v.comment,
      visitedAt: v.visitedAt,
    })),
    newAchievements: unnotified.map((a) => ({ key: a.key, label: a.label })),
  });
}

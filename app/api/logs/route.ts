import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { RANK_THRESHOLDS } from "@/lib/data/scadApps";
import { calcRank, detectVisitMilestones, detectRegularBadge } from "@/lib/rank";
import { buildThreadsSharePayload } from "@/lib/share";
import { pickActivities } from "@/lib/data/activities";

// 純粋なJSON API。Next.jsの画面状態には一切依存せず、SwiftUIからも同じレスポンスをそのまま使える。
//
// この応答が返るまでユーザーは結果画面を見られないので、DBとの往復回数を最小にしてある。
// 読み取りは全て並列、書き込みは1回のトランザクションにまとめ、往復2回で完了させる。

// DB(Neon)はシンガポールにあるため、同じリージョンで実行して往復ごとの遅延を抑える
export const preferredRegion = "sin1";

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotId, comment, imageUrl } = await req.json();
  if (!spotId) return NextResponse.json({ error: "spotId is required" }, { status: 400 });

  // 互いに独立した読み取りなので同時に投げる(直列だと往復のたびに待たされる)。
  // 存在しない店を指定された場合にプロフィールだけ先に作られるが、来店0件の空レコードなので害はない。
  const [spot, profile, achieved, visitsAtSpotBefore] = await Promise.all([
    prisma.spot.findUnique({ where: { id: spotId } }),
    prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: { userId, displayName: "ゲストユーザー" },
    }),
    prisma.userAchievement.findMany({ where: { userId }, select: { key: true } }),
    prisma.visitLog.count({ where: { userId, spotId } }),
  ]);

  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });

  // 書き込み後の値を先に確定させ、実績判定まで済ませてから1回で書き込む。
  // visitCountの実体は increment で更新するため、同時実行があってもDBの値はズレない。
  const visitCount = profile.visitCount + 1;
  const visitsAtSpot = visitsAtSpotBefore + 1;
  const newRank = calcRank(visitCount);

  const achievedKeys = new Set(achieved.map((a) => a.key));
  const newAchievements = [
    ...detectVisitMilestones(visitCount, achievedKeys),
    detectRegularBadge(spot.id, spot.name, visitsAtSpot, achievedKeys),
  ].filter((a): a is NonNullable<typeof a> => a !== null);

  // IDと日時を先に採番しておけば書き込み結果を待たずに全ての値が確定し、
  // 書き込みを1往復にまとめられる。
  const visitLogId = randomUUID();
  const visitedAt = new Date();

  const writes: Prisma.PrismaPromise<unknown>[] = [
    prisma.visitLog.create({ data: { id: visitLogId, userId, spotId, comment, imageUrl, visitedAt } }),
    prisma.userProfile.update({
      where: { userId },
      data: { visitCount: { increment: 1 }, soloRank: newRank },
    }),
  ];
  if (newAchievements.length) {
    writes.push(
      prisma.userAchievement.createMany({
        data: newAchievements.map((a) => ({ userId, key: a.key, label: a.label })),
        skipDuplicates: true,
      }),
    );
  }
  await prisma.$transaction(writes);

  return NextResponse.json({
    log: { id: visitLogId, spotId, comment, imageUrl, visitedAt },
    spot: { id: spot.id, name: spot.name, category: spot.category, subCategories: spot.subCategories },
    visitCount,
    soloRank: newRank,
    rankLabel: RANK_THRESHOLDS[newRank].label,
    newAchievements,                 // バナー表示対象。空配列なら何も出さない
    activities: pickActivities(spot.category, spot.subCategories), // 決定後の画面に出すアクティビティ
    share: buildThreadsSharePayload({ spotName: spot.name, visitCount }),
  });
}

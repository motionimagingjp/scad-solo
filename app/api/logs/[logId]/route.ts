import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { calcRank } from "@/lib/rank";

// 来店ログの削除。「行っていない」「見せたくない」を後から取り消せるようにする。
//
// 実績(UserAchievement)は取り消さない。過去に一度達成した事実として残す方が自然で、
// 「削除のたびに実績を巻き戻す」処理は複雑さの割に得るものが少ないため。
// visitCountはincrement/decrementの積み上げだと削除時にズレうるので、削除後に
// 残っているログ数を数え直して確定させる(常に実体と一致させる)。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";

export async function DELETE(req: NextRequest, { params }: { params: { logId: string } }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const log = await prisma.visitLog.findUnique({ where: { id: params.logId } });
  if (!log || log.userId !== userId) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.stamp.deleteMany({ where: { visitLogId: log.id } }),
    prisma.visitLog.delete({ where: { id: log.id } }),
  ]);

  const visitCount = await prisma.visitLog.count({ where: { userId } });
  const soloRank = calcRank(visitCount);
  await prisma.userProfile.update({ where: { userId }, data: { visitCount, soloRank } });

  return NextResponse.json({ visitCount, soloRank });
}

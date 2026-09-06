import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { calcRank } from "@/lib/rank";

// 来店ログ1件の更新(メモ)と削除。
//
// DELETE: 「行っていない」「見せたくない」を後から取り消せるようにする。
// 実績(UserAchievement)は取り消さない。過去に一度達成した事実として残す方が自然で、
// 「削除のたびに実績を巻き戻す」処理は複雑さの割に得るものが少ないため。
// visitCountはincrement/decrementの積み上げだと削除時にズレうるので、削除後に
// 残っているログ数を数え直して確定させる(常に実体と一致させる)。
//
// PATCH: メモ(使った金額・誰と会ったか等)の追記・編集。VisitLog.comment に保存する。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";

const MEMO_MAX_LENGTH = 500;

/** 本人のログか確認する。他人のログを触られないよう、更新・削除の前に必ず通す */
async function findOwnLog(req: NextRequest, logId: string) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };

  const log = await prisma.visitLog.findUnique({ where: { id: logId } });
  if (!log || log.userId !== userId) {
    return { error: NextResponse.json({ error: "not found" }, { status: 404 }) };
  }
  return { userId, log };
}

export async function PATCH(req: NextRequest, { params }: { params: { logId: string } }) {
  const found = await findOwnLog(req, params.logId);
  if (found.error) return found.error;

  const { comment } = await req.json();
  if (comment !== null && typeof comment !== "string") {
    return NextResponse.json({ error: "comment must be a string or null" }, { status: 400 });
  }

  // 空文字は「メモなし」と同じ扱いにして、空の吹き出しが残らないようにする
  const trimmed = typeof comment === "string" ? comment.trim().slice(0, MEMO_MAX_LENGTH) : null;
  const updated = await prisma.visitLog.update({
    where: { id: params.logId },
    data: { comment: trimmed === "" ? null : trimmed },
  });

  return NextResponse.json({ id: updated.id, comment: updated.comment });
}

export async function DELETE(req: NextRequest, { params }: { params: { logId: string } }) {
  const found = await findOwnLog(req, params.logId);
  if (found.error) return found.error;
  const { userId } = found;

  await prisma.visitLog.delete({ where: { id: params.logId } });

  const visitCount = await prisma.visitLog.count({ where: { userId } });
  const soloRank = calcRank(visitCount);
  await prisma.userProfile.update({ where: { userId }, data: { visitCount, soloRank } });

  return NextResponse.json({ visitCount, soloRank });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLoggedInUserId } from "@/lib/auth";

export const preferredRegion = "sin1";

// お気に入りのトグル。押すたびに登録/解除が切り替わる
export async function POST(req: NextRequest) {
  const userId = await getLoggedInUserId();
  if (!userId) return NextResponse.json({ error: "login required" }, { status: 401 });

  const { spotId } = await req.json().catch(() => ({}));
  if (typeof spotId !== "string") return NextResponse.json({ error: "spotId is required" }, { status: 400 });

  const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { id: true } });
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });

  const removed = await prisma.favorite.deleteMany({ where: { userId, spotId } });
  if (removed.count > 0) return NextResponse.json({ favorited: false });

  // 連打で同時に2回登録が走っても unique 制約で1件に収まる
  await prisma.favorite.createMany({ data: [{ userId, spotId }], skipDuplicates: true });
  return NextResponse.json({ favorited: true });
}

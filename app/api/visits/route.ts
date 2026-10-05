import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getLoggedInUserId } from "@/lib/auth";
import { jstDateString } from "@/lib/jst";

export const preferredRegion = "sin1";

// 「行った！」の記録。同一ユーザー・同一店舗はJSTの同じ日に1回まで(DBのunique制約で保証)
export async function POST(req: NextRequest) {
  const userId = await getLoggedInUserId();
  if (!userId) return NextResponse.json({ error: "login required" }, { status: 401 });

  const { spotId } = await req.json().catch(() => ({}));
  if (typeof spotId !== "string") return NextResponse.json({ error: "spotId is required" }, { status: 400 });

  const spot = await prisma.spot.findUnique({ where: { id: spotId }, select: { id: true } });
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });

  try {
    await prisma.visit.create({ data: { userId, spotId, visitDate: jstDateString() } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "already visited today" }, { status: 409 });
    }
    throw e;
  }

  const visitCount = await prisma.visit.count({ where: { userId, spotId } });
  return NextResponse.json({ visitedToday: true, visitCount });
}

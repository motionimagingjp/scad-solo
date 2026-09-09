import { NextRequest, NextResponse } from "next/server";
import { SpotStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// レビュー待ち(status: AI_SUGGESTED)の一覧。承認/却下用のURLも一緒に返すので、
// このJSONを見ながらブラウザで各リンクを開くだけでレビューできる。

export const preferredRegion = "sin1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const secret = searchParams.get("secret");
  const authorized = auth === `Bearer ${process.env.CRON_SECRET}` || secret === process.env.CRON_SECRET;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const station = searchParams.get("station")?.trim();
  const spots = await prisma.spot.findMany({
    where: { status: SpotStatus.AI_SUGGESTED, ...(station ? { nearestStation: station } : {}) },
    orderBy: { createdAt: "desc" },
  });

  const origin = new URL(req.url).origin;
  const secretQuery = secret ? `?secret=${encodeURIComponent(secret)}` : "";

  return NextResponse.json({
    count: spots.length,
    spots: spots.map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      nearestStation: s.nearestStation,
      tagline: s.tagline,
      sourceNote: s.sourceNote,
      approveUrl: `${origin}/api/admin/spots/${s.id}/approve${secretQuery}`,
      rejectUrl: `${origin}/api/admin/spots/${s.id}/reject${secretQuery}`,
    })),
  });
}

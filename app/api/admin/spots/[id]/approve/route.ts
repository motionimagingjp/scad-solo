import { NextRequest, NextResponse } from "next/server";
import { SpotStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// AI提案(status: AI_SUGGESTED)を人が確認して確定させるためのエンドポイント。
// ブラウザで直接叩ける形にしてあるので、レビュー後はこのURLを開くだけでいい
// (例: /api/admin/spots/xxxxx/approve?secret=...)。

export const preferredRegion = "sin1";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  // CRON_SECRET未設定時に「Bearer undefined」等で通らないよう、先に存在を確認する
  const authorized = !!process.env.CRON_SECRET && (auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET);
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const spot = await prisma.spot.findUnique({ where: { id: params.id } });
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });

  await prisma.spot.update({ where: { id: params.id }, data: { status: SpotStatus.ACTIVE } });
  return NextResponse.json({ id: params.id, name: spot.name, status: "ACTIVE" });
}

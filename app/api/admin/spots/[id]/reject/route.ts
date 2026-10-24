import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// AI提案(status: AI_SUGGESTED)を人が見て「違う・怪しい」と判断した場合に
// 削除するエンドポイント。確定前のデータだけを対象にする(誤って人力確認済みの
// ACTIVEデータを消してしまわないためのガード)。

export const preferredRegion = "sin1";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  // CRON_SECRET未設定時に「Bearer undefined」等で通らないよう、先に存在を確認する
  const authorized = !!process.env.CRON_SECRET && (auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET);
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const spot = await prisma.spot.findUnique({ where: { id: params.id } });
  if (!spot) return NextResponse.json({ error: "spot not found" }, { status: 404 });
  if (spot.status !== "AI_SUGGESTED") {
    return NextResponse.json({ error: "AI_SUGGESTED以外は/rejectで消せません(誤操作防止)" }, { status: 400 });
  }

  await prisma.spot.delete({ where: { id: params.id } });
  return NextResponse.json({ id: params.id, name: spot.name, deleted: true });
}

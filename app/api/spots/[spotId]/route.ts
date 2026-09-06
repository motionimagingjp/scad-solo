import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 決定画面で「どの店を選んでいるか」を表示するための1件取得。
export async function GET(_req: Request, { params }: { params: { spotId: string } }) {
  const spot = await prisma.spot.findUnique({ where: { id: params.spotId } });
  if (!spot) return NextResponse.json({ error: "not found" }, { status: 404 });

  return NextResponse.json({
    id: spot.id,
    name: spot.name,
    category: spot.category,
    subCategories: spot.subCategories,
    hasCounterSeat: spot.hasCounterSeat,
    senberoAvailable: spot.senberoAvailable,
    address: spot.address,
  });
}

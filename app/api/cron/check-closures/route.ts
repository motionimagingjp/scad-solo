import { NextRequest, NextResponse } from "next/server";
import { SpotStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// 閉店確認バッチ。Vercel Cron(月1回、vercel.jsonで設定)から叩く想定。
// Places API (New) の businessStatus は構造化データで信頼性が高いため、
// AIに毎回「閉店してますか?」と聞き直すより優先してこちらを使う。
// 閉業が疑われても即削除はせず NEEDS_REVIEW にとどめ、人が最終確認してから
// CLOSED にする(誤検知で実在店を消してしまわないため)。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";

const BATCH_SIZE = 50; // 1回の実行で確認する件数の上限(実行時間・APIコストの上限)
const RECHECK_AFTER_DAYS = 30;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GOOGLE_SERVER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_SERVER_API_KEY is not set" }, { status: 500 });
  }

  const recheckThreshold = new Date(Date.now() - RECHECK_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const targets = await prisma.spot.findMany({
    where: {
      status: SpotStatus.ACTIVE,
      googlePlaceId: { not: null },
      OR: [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: recheckThreshold } }],
    },
    take: BATCH_SIZE,
  });

  let checked = 0;
  let flagged = 0;

  for (const spot of targets) {
    const url = `https://places.googleapis.com/v1/places/${spot.googlePlaceId}?fields=businessStatus&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Places API error for ${spot.id}: ${res.status}`);
      continue;
    }
    const data = await res.json();
    checked++;

    if (data.businessStatus === "CLOSED_PERMANENTLY") {
      await prisma.spot.update({
        where: { id: spot.id },
        data: { status: SpotStatus.NEEDS_REVIEW, lastVerifiedAt: new Date() },
      });
      flagged++;
    } else {
      await prisma.spot.update({ where: { id: spot.id }, data: { lastVerifiedAt: new Date() } });
    }
  }

  return NextResponse.json({ checked, flagged, remaining: targets.length === BATCH_SIZE });
}

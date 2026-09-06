import { NextRequest, NextResponse } from "next/server";

// Vercelがリクエストに付与する位置情報ヘッダから、おおよそのエリアを返す。
// 位置情報を許可しないユーザーへの初期表示用(無料・精度は市区町村レベル)。
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const lat = Number.parseFloat(req.headers.get("x-vercel-ip-latitude") ?? "");
  const lng = Number.parseFloat(req.headers.get("x-vercel-ip-longitude") ?? "");
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "unavailable" }, { status: 404 });
  }

  const city = req.headers.get("x-vercel-ip-city");
  return NextResponse.json({
    lat,
    lng,
    label: city ? decodeURIComponent(city) : "現在のエリア",
  });
}

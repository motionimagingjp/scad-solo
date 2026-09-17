import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 特定の店舗を本番DBから削除する管理用エンドポイント。/api/admin/import-spots等と
// 同じ構成(このプロジェクトのDB更新はVercel経由が実態のため、デプロイ後に叩く運用)。
// 「気に入らないので消してほしい」のような、閉業ではなく編集判断での削除に使う
// (閉業確認バッチとは別。閉業はstatus:CLOSEDで扱う)。
//
// name+addressの完全一致で1件だけ削除する(インポート系と同じ突合キー)。
// 来店ログ等から参照されている場合は外部キー制約で削除に失敗するので、その旨を返す。
//
// 認証は CRON_SECRET を流用(?secret=クエリ か Authorization: Bearer のどちらでも可)。

export const preferredRegion = "sin1";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const authorized = auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const name = searchParams.get("name");
  const address = searchParams.get("address");
  if (!name || !address) {
    return NextResponse.json({ error: "name と address のクエリパラメータが必要です" }, { status: 400 });
  }

  const spot = await prisma.spot.findFirst({ where: { name, address } });
  if (!spot) {
    return NextResponse.json({ error: "該当する店舗が見つかりません", name, address }, { status: 404 });
  }

  try {
    await prisma.spot.delete({ where: { id: spot.id } });
  } catch (e) {
    return NextResponse.json(
      { error: "削除に失敗しました(来店ログ等から参照されている可能性があります)", detail: String(e) },
      { status: 409 },
    );
  }

  return NextResponse.json({ deleted: { id: spot.id, name: spot.name, address: spot.address } });
}

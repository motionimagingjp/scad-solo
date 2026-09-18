import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// name+address完全一致の重複Spotを統合する管理用エンドポイント。
//
// /api/admin/import-scene-candidates 等の投入処理は findFirst→create/update という
// 非アトミックな手順で重複判定をしていたため、同じリクエストが短時間に2回走ると
// (二重タップ・ブラウザの再送など)、コミット前のfindFirstが両方とも「無い」と
// 判定して2行作られることがあった。このエンドポイントは既存の重複を後から掃除する。
// 恒久対策はSpot(name, address)への一意制約の追加(別マイグレーション)。
//
// 認証は CRON_SECRET を流用(?secret=クエリ か Authorization: Bearer のどちらでも可)。

export const preferredRegion = "sin1";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const authorized = auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const dupGroups = await prisma.spot.groupBy({
    by: ["name", "address"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });

  const results: { name: string; address: string; kept: string; merged: number; failed?: string }[] = [];

  for (const group of dupGroups) {
    const spots = await prisma.spot.findMany({
      where: { name: group.name, address: group.address },
      orderBy: { createdAt: "asc" },
      include: { scenes: true },
    });
    const [keep, ...dupes] = spots;

    let merged = 0;
    let failed: string | undefined;

    for (const dupe of dupes) {
      // 重複側が持っていて、残す側には無いシーンだけ付け替える
      // (双方が同じsceneを持つ場合はSpot削除時のonDelete: Cascadeでそのまま消える)
      for (const scene of dupe.scenes) {
        const alreadyOnKeep = keep.scenes.some((s) => s.scene === scene.scene);
        if (!alreadyOnKeep) {
          await prisma.spotScene.update({ where: { id: scene.id }, data: { spotId: keep.id } });
        }
      }
      // VisitLog(onDelete: Restrict)・Event(onDelete: SetNull)ともに、
      // 削除前に残す側へ付け替えておかないと来店ログが消えたり削除自体が失敗する
      await prisma.visitLog.updateMany({ where: { spotId: dupe.id }, data: { spotId: keep.id } });
      await prisma.event.updateMany({ where: { spotId: dupe.id }, data: { spotId: keep.id } });

      try {
        await prisma.spot.delete({ where: { id: dupe.id } });
        merged += 1;
      } catch (e) {
        failed = String(e);
      }
    }
    results.push({ name: group.name, address: group.address, kept: keep.id, merged, ...(failed ? { failed } : {}) });
  }

  return NextResponse.json({
    duplicateGroups: dupGroups.length,
    results,
  });
}

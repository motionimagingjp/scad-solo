import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importSceneCandidate, type SceneCandidate } from "@/lib/scene-candidates";

import dateBatch1 from "@/data/scene-candidates-date-batch1.json";
import dateBatch2 from "@/data/scene-candidates-date-batch2.json";

// デート・グループ向けに新規収集した候補店舗(data/scene-candidates-*.json)をDBへ
// 一括投入する管理用エンドポイント。/api/admin/import-spots と同じ構成
// (このプロジェクトのクラウド開発環境からはDB/Google APIに直接繋ぐ手段がないため、
// デプロイ後にこのエンドポイントを一度叩く運用)。取り込みロジックは
// lib/scene-candidates.ts に共通化してある。
//
// 認証は CRON_SECRET を流用(?secret=クエリ か Authorization: Bearer のどちらでも可)。
//
// 新しいバッチを追加するときは、このファイル上部にimportを足してALL_CANDIDATESに
// 足すだけでよい(スキーマ変更は不要)。

// DB(シンガポール)と同じリージョンで動かす
export const preferredRegion = "sin1";
// 逐次ジオコーディングするとVercelのデフォルトタイムアウトを超えかねないため延長
export const maxDuration = 60;

const ALL_CANDIDATES: SceneCandidate[] = [...dateBatch1, ...dateBatch2] as SceneCandidate[];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get("authorization");
  const authorized = auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get("secret") === process.env.CRON_SECRET;
  if (!authorized) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.GOOGLE_SERVER_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_SERVER_API_KEY is not set" }, { status: 500 });

  // 1回で処理しきれない場合のバッチ実行用。例: ?offset=0&limit=50 → 次は ?offset=50&limit=50
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? String(ALL_CANDIDATES.length));
  const batch = ALL_CANDIDATES.slice(offset, offset + limit);

  const results = [];
  for (const candidate of batch) {
    results.push(await importSceneCandidate(prisma, candidate, apiKey));
  }

  const summary = {
    processedRange: `${offset}-${offset + batch.length}`,
    totalCandidates: ALL_CANDIDATES.length,
    remaining: Math.max(0, ALL_CANDIDATES.length - (offset + batch.length)),
    created: results.filter((r) => r.ok && r.action === "created").length,
    updated: results.filter((r) => r.ok && r.action === "updated").length,
    failed: results.filter((r) => !r.ok).length,
  };

  return NextResponse.json({ summary, results });
}

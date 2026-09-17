// デート・グループ向け候補店舗JSONをローカルから投入する開発用スクリプト。
// 実行例: GOOGLE_SERVER_API_KEY=xxx npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/import-scene-candidates.ts data/scene-candidates-yotsuya.json
//
// 実際の本番投入は app/api/admin/import-scene-candidates/route.ts をVercel上で叩く方式を使う
// (このプロジェクトのクラウド開発環境からはDB/Google APIに直接繋ぐ手段がないため)。
// 取り込みロジックは lib/scene-candidates.ts に共通化してあり、このスクリプトと
// 管理用APIの両方から呼んでいる(ロジックが二重管理でズレるのを防ぐため)。

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import { importSceneCandidate, type SceneCandidate } from "../lib/scene-candidates";

const prisma = new PrismaClient();

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("使い方: ts-node scripts/import-scene-candidates.ts <candidates.json>");
    process.exit(1);
  }
  const apiKey = process.env.GOOGLE_SERVER_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_SERVER_API_KEY が未設定です(サーバー用の非公開キーが必要)");

  const candidates: SceneCandidate[] = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  console.log(`${candidates.length}件を処理します...`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const result = await importSceneCandidate(prisma, candidate, apiKey);
    if (!result.ok) {
      failed++;
      console.log(`  ✗ ${candidate.name}: ${result.error}`);
      continue;
    }
    if (result.action === "created") created++;
    else updated++;
    console.log(`  ✓ ${result.action === "created" ? "新規" : "更新"}: ${candidate.name} [${result.scenes.join(",")}]`);
  }

  console.log(`完了: 新規${created}件 / 更新${updated}件 / 失敗${failed}件`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

// 既存店にシーン別の適性(SpotScene)を付けるスクリプト。
// 実行例(確認のみ): npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/flag-scenes.ts DATE
// 実行例(書き込み): 同上 + --apply
// スコアの足切りを変える: --min=8
//
// 既定はドライラン(何件どう入るかを表示するだけ)。--apply を付けたときだけDBに書く。
//
// ターゲット:
//   DATE  35-49歳・2名・1人6,000〜12,000円
//   GROUP 45-65歳・2-4名・1人4,000〜8,000円
//
// 重要な制約: 既存データに価格情報が無いため、予算帯そのものでは絞れない。
// 立ち飲み・せんべろ・角打ちのような明確に価格帯が下の業態を除外し、業態と推し文から
// 候補を出すところまでが限界。ここで付くスコアは「候補」であって確定ではないので、
// verifiedAt は入れない(人が確認したものだけ後から入れる)。

import { PrismaClient, Scene, SpotStatus, type Spot } from "@prisma/client";

const prisma = new PrismaClient();

// これ未満は候補にしない。6まで下げると「日本酒＋カウンター」だけの素のソロ向けバーが
// 大量に入ってしまうため、既定は7。--min=N で調整できる
const DEFAULT_MIN_SCORE = 7;

// 価格帯・業態の面でデートにもグループにも向かない業態
function isCheapStandingType(spot: Spot): boolean {
  return (
    spot.senberoAvailable ||
    spot.subCategories.some((t) => ["立ち飲み", "角打ち", "大衆酒場", "ビールスタンド"].includes(t))
  );
}

type Judgement = { score: number; reason: string } | null;

let minScore = DEFAULT_MIN_SCORE;

// デート(35-49歳・2名)。カウンターの横並びが効くので、ソロ向けの資産がそのまま活きる。
// 専門性(ワイン・日本酒)は会話のフックになるので加点する。
function judgeDate(spot: Spot): Judgement {
  if (isCheapStandingType(spot)) return null;

  let score = 5;
  const reasons: string[] = [];
  const tags = spot.subCategories;
  const tagline = spot.tagline ?? "";

  if (tags.includes("ワイン")) { score += 2; reasons.push("ワイン"); }
  if (tags.includes("日本酒")) { score += 1; reasons.push("日本酒"); }
  if (tags.some((t) => ["隠れ家", "BAR", "ウイスキー", "ワインバー"].includes(t))) {
    score += 1;
    reasons.push("バー業態");
  }
  if (/落ち着|静か|隠れ家|雰囲気|こだわり/.test(tagline)) { score += 1; reasons.push("落ち着いた推し文"); }
  if (spot.hasCounterSeat) { score += 1; reasons.push("カウンター横並び"); }

  // 「一人向け」と明記された店はデートには向かない
  if (/一人|ひとり|独り/.test(tagline)) { score -= 2; reasons.push("一人向けの推し文(減点)"); }
  if (/気軽|リーズナブル|安い|コスパ|立ち食い/.test(tagline)) { score -= 1; reasons.push("価格訴求(減点)"); }

  score = Math.max(1, Math.min(10, score));
  if (score < minScore) return null;
  return { score, reason: reasons.join(" / ") };
}

// グループ(45-65歳・2-4名)。4人が向かい合って会話できることが要件なので、
// テーブル席が確認できた店だけが対象。座席情報は既存データに無いため、
// 収集が済むまでこの関数は何も返さない(未確認の店をグループ検索に出さないため)。
function judgeGroup(spot: Spot): Judgement {
  if (isCheapStandingType(spot)) return null;
  if (spot.hasTableSeat !== true) return null;

  let score = 5;
  const reasons: string[] = ["テーブル席"];

  if (spot.hasPrivateRoom) { score += 2; reasons.push("個室"); }
  if (spot.acceptsReservation) { score += 2; reasons.push("予約可"); }
  if ((spot.maxGroupSize ?? 0) >= 4) { score += 1; reasons.push("4名以上可"); }
  if (/落ち着|静か/.test(spot.tagline ?? "")) { score += 1; reasons.push("静かな推し文"); }

  score = Math.max(1, Math.min(10, score));
  if (score < minScore) return null;
  return { score, reason: reasons.join(" / ") };
}

const JUDGES: Record<string, (spot: Spot) => Judgement> = {
  [Scene.DATE]: judgeDate,
  [Scene.GROUP]: judgeGroup,
};

async function main() {
  const scene = process.argv[2];
  const apply = process.argv.includes("--apply");
  const minArg = process.argv.find((a) => a.startsWith("--min="));
  if (minArg) minScore = Number(minArg.split("=")[1]);

  const judge = scene ? JUDGES[scene] : undefined;
  if (!judge) {
    console.error(`使い方: ts-node scripts/flag-scenes.ts <DATE|GROUP> [--apply]`);
    process.exit(1);
  }

  const spots = await prisma.spot.findMany({
    where: { status: { in: [SpotStatus.ACTIVE, SpotStatus.AI_SUGGESTED] } },
  });

  const hits = spots
    .map((spot) => ({ spot, judgement: judge(spot) }))
    .filter((r): r is { spot: Spot; judgement: NonNullable<Judgement> } => r.judgement !== null)
    .sort((a, b) => b.judgement.score - a.judgement.score);

  console.log(`対象${spots.length}件 → ${scene}の候補${hits.length}件 (スコア${minScore}以上)`);
  for (const { spot, judgement } of hits) {
    console.log(`  [${judgement.score}] ${spot.name} (${spot.nearestStation ?? "駅不明"}) — ${judgement.reason}`);
  }

  if (!apply) {
    console.log(`\nドライランです。DBに書き込むには --apply を付けてください。`);
    await prisma.$disconnect();
    return;
  }

  for (const { spot, judgement } of hits) {
    await prisma.spotScene.upsert({
      where: { spotId_scene: { spotId: spot.id, scene: scene as Scene } },
      update: { score: judgement.score, reason: judgement.reason },
      create: { spotId: spot.id, scene: scene as Scene, score: judgement.score, reason: judgement.reason },
    });
  }
  console.log(`\n${hits.length}件を書き込みました。`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

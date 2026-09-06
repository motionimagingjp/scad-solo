import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 動作確認用のダミー店舗。「さがす」画面の検索APIを複数件でテストするため3件用意する。
// 実店舗データが揃い次第、この3件は削除して差し替える想定。
async function main() {
  await prisma.spot.upsert({
    where: { id: "spot_demo" },
    update: {},
    create: {
      id: "spot_demo",
      name: "立飲み・〇〇",
      category: "SOLO_NOMI",
      subCategories: [],
      address: "東京都渋谷区テスト1-1-1",
      latitude: 35.6595,
      longitude: 139.7005,
      hasCounterSeat: true,
      senberoAvailable: true,
      soloFriendliness: 8,
    },
  });

  await prisma.spot.upsert({
    where: { id: "spot_demo_karaoke" },
    update: {},
    create: {
      id: "spot_demo_karaoke",
      name: "ソロカラオケ・△△",
      category: "SOLO_SPOT",
      subCategories: ["カラオケ"],
      address: "東京都渋谷区テスト1-2-2",
      latitude: 35.661,
      longitude: 139.702,
      hasCounterSeat: false,
      senberoAvailable: false,
      soloFriendliness: 9,
    },
  });

  await prisma.spot.upsert({
    where: { id: "spot_demo_sauna" },
    update: {},
    create: {
      id: "spot_demo_sauna",
      name: "サウナ・□□",
      category: "SOLO_SPOT",
      subCategories: ["サウナ"],
      address: "東京都渋谷区テスト1-3-3",
      latitude: 35.658,
      longitude: 139.699,
      hasCounterSeat: false,
      senberoAvailable: false,
      soloFriendliness: 7,
    },
  });

  console.log("seed完了: デモ店舗3件を作成/更新しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

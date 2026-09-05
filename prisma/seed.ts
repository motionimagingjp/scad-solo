import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 動作確認用のダミー店舗。app/page.tsx のMOCK_SPOTと同じID("spot_demo")で作成する。
// 実装が進んだら、このseedは「検索APIのテストデータ」として複数件に増やしていく。
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
  console.log("seed完了: spot_demo を作成/更新しました");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

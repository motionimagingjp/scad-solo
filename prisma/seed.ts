import { PrismaClient, type Category } from "@prisma/client";

const prisma = new PrismaClient();

// 動作確認用のダミー店舗。実在の店ではないため、名前は記号のままにしてある。
// 「今夜の3軒」の抽選と場所切り替えを体感できるよう、渋谷・池袋の2エリアに分けて配置する。
// 実店舗データが揃い次第、ここは丸ごと差し替える。

type DemoSpot = {
  id: string;
  name: string;
  category: Category;
  subCategories: string[];
  address: string;
  latitude: number;
  longitude: number;
  hasCounterSeat: boolean;
  senberoAvailable: boolean;
  soloFriendliness: number;
};

const DEMO_SPOTS: DemoSpot[] = [
  // --- 渋谷エリア ---
  { id: "spot_demo", name: "立飲み・〇〇", category: "SOLO_NOMI", subCategories: [], address: "東京都渋谷区テスト1-1-1", latitude: 35.6595, longitude: 139.7005, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 8 },
  { id: "spot_demo_karaoke", name: "ソロカラオケ・△△", category: "SOLO_SPOT", subCategories: ["カラオケ"], address: "東京都渋谷区テスト1-2-2", latitude: 35.661, longitude: 139.702, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 9 },
  { id: "spot_demo_sauna", name: "サウナ・□□", category: "SOLO_SPOT", subCategories: ["サウナ"], address: "東京都渋谷区テスト1-3-3", latitude: 35.658, longitude: 139.699, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 7 },
  { id: "spot_demo_kakuuchi", name: "角打ち・◇◇", category: "SOLO_NOMI", subCategories: [], address: "東京都渋谷区テスト2-1-1", latitude: 35.6572, longitude: 139.7031, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 9 },
  { id: "spot_demo_wine", name: "ワインバー・☆☆", category: "SOLO_NOMI", subCategories: [], address: "東京都渋谷区テスト2-2-2", latitude: 35.6608, longitude: 139.6982, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 7 },
  { id: "spot_demo_sake", name: "日本酒バル・※※", category: "SOLO_NOMI", subCategories: [], address: "東京都渋谷区テスト2-3-3", latitude: 35.6563, longitude: 139.6994, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 8 },
  { id: "spot_demo_ramen", name: "一人ラーメン・▲▲", category: "SOLO_MESHI", subCategories: [], address: "東京都渋谷区テスト3-1-1", latitude: 35.6588, longitude: 139.7042, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 10 },
  { id: "spot_demo_yakitori", name: "焼き鳥・◎◎", category: "SOLO_NOMI", subCategories: [], address: "東京都渋谷区テスト3-2-2", latitude: 35.6621, longitude: 139.7008, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 8 },

  // --- 池袋エリア ---
  { id: "spot_demo_ike_tachinomi", name: "立飲み・▽▽", category: "SOLO_NOMI", subCategories: [], address: "東京都豊島区テスト1-1-1", latitude: 35.7295, longitude: 139.7109, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 9 },
  { id: "spot_demo_ike_sake", name: "日本酒処・◆◆", category: "SOLO_NOMI", subCategories: [], address: "東京都豊島区テスト1-2-2", latitude: 35.7312, longitude: 139.7135, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 8 },
  { id: "spot_demo_ike_sauna", name: "サウナ・▼▼", category: "SOLO_SPOT", subCategories: ["サウナ"], address: "東京都豊島区テスト2-1-1", latitude: 35.7268, longitude: 139.7091, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 8 },
  { id: "spot_demo_ike_karaoke", name: "ソロカラオケ・◇▽", category: "SOLO_SPOT", subCategories: ["カラオケ"], address: "東京都豊島区テスト2-2-2", latitude: 35.7331, longitude: 139.7118, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 9 },
  { id: "spot_demo_ike_meshi", name: "一人定食・○△", category: "SOLO_MESHI", subCategories: [], address: "東京都豊島区テスト3-1-1", latitude: 35.7281, longitude: 139.7152, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 10 },
];

async function main() {
  for (const spot of DEMO_SPOTS) {
    await prisma.spot.upsert({ where: { id: spot.id }, update: {}, create: spot });
  }
  console.log(`seed完了: デモ店舗${DEMO_SPOTS.length}件を作成/更新しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

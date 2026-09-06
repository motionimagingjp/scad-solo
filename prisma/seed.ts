import { PrismaClient, type Category } from "@prisma/client";

const prisma = new PrismaClient();

// 動作確認用のダミー店舗。実在の店ではないため、名前は記号のままにしてある。
// ルーレットの抽選と場所切り替えを体感できるよう、渋谷・池袋の2エリアに分けて配置する。
// 実店舗データが揃い次第、ここは丸ごと差し替える。

type DemoSpot = {
  id: string;
  name: string;
  category: Category;
  subCategories: string[];
  address: string;
  tagline: string;
  latitude: number;
  longitude: number;
  hasCounterSeat: boolean;
  senberoAvailable: boolean;
  soloFriendliness: number;
};

const DEMO_SPOTS: DemoSpot[] = [
  // --- 渋谷エリア ---
  { id: "spot_demo", name: "立飲み・〇〇", category: "SOLO_NOMI", subCategories: ["立ち飲み", "ビール"], address: "東京都渋谷区テスト1-1-1", tagline: "一人客が7割。30分で切り上げても浮かない", latitude: 35.6595, longitude: 139.7005, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 8 },
  { id: "spot_demo_karaoke", name: "ソロカラオケ・△△", category: "SOLO_SPOT", subCategories: ["カラオケ"], address: "東京都渋谷区テスト1-2-2", tagline: "一人専用ブースあり。受付も無人で気楽", latitude: 35.661, longitude: 139.702, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 9 },
  { id: "spot_demo_sauna", name: "サウナ・□□", category: "SOLO_SPOT", subCategories: ["サウナ", "女性ひとり歓迎"], address: "東京都渋谷区テスト1-3-3", tagline: "女性専用フロアあり。深夜1時まで", latitude: 35.658, longitude: 139.699, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 7 },
  { id: "spot_demo_kakuuchi", name: "角打ち・◇◇", category: "SOLO_NOMI", subCategories: ["立ち飲み", "日本酒", "ビール"], address: "東京都渋谷区テスト2-1-1", tagline: "1000円で3杯。日本酒の品揃えが渋い", latitude: 35.6572, longitude: 139.7031, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 9 },
  { id: "spot_demo_wine", name: "ワインバー・☆☆", category: "SOLO_NOMI", subCategories: ["ワイン", "女性ひとり歓迎"], address: "東京都渋谷区テスト2-2-2", tagline: "グラスワイン12種。女性一人客も多い", latitude: 35.6608, longitude: 139.6982, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 7 },
  { id: "spot_demo_sake", name: "日本酒バル・※※", category: "SOLO_NOMI", subCategories: ["日本酒"], address: "東京都渋谷区テスト2-3-3", tagline: "全国の地酒を月替わりで。半合から頼める", latitude: 35.6563, longitude: 139.6994, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 8 },
  { id: "spot_demo_ramen", name: "一人ラーメン・▲▲", category: "SOLO_MESHI", subCategories: [], address: "東京都渋谷区テスト3-1-1", tagline: "全席仕切り付き。誰とも顔を合わせず食べられる", latitude: 35.6588, longitude: 139.7042, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 10 },
  { id: "spot_demo_yakitori", name: "焼き鳥・◎◎", category: "SOLO_NOMI", subCategories: ["ビール"], address: "東京都渋谷区テスト3-2-2", tagline: "1本120円から。串2本+ビールでサクッと", latitude: 35.6621, longitude: 139.7008, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 8 },

  // --- 池袋エリア ---
  { id: "spot_demo_ike_tachinomi", name: "立飲み・▽▽", category: "SOLO_NOMI", subCategories: ["立ち飲み", "ビール"], address: "東京都豊島区テスト1-1-1", tagline: "駅から徒歩1分。仕事帰りの一杯にちょうどいい", latitude: 35.7295, longitude: 139.7109, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 9 },
  { id: "spot_demo_ike_sake", name: "日本酒処・◆◆", category: "SOLO_NOMI", subCategories: ["日本酒", "女性ひとり歓迎"], address: "東京都豊島区テスト1-2-2", tagline: "静かめの店内。読書しながら飲む常連も", latitude: 35.7312, longitude: 139.7135, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 8 },
  { id: "spot_demo_ike_sauna", name: "サウナ・▼▼", category: "SOLO_SPOT", subCategories: ["サウナ"], address: "東京都豊島区テスト2-1-1", tagline: "24時間営業。終電を逃しても駆け込める", latitude: 35.7268, longitude: 139.7091, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 8 },
  { id: "spot_demo_ike_karaoke", name: "ソロカラオケ・◇▽", category: "SOLO_SPOT", subCategories: ["カラオケ", "女性ひとり歓迎"], address: "東京都豊島区テスト2-2-2", tagline: "平日昼は1時間300円。防音室で思い切り歌える", latitude: 35.7331, longitude: 139.7118, hasCounterSeat: false, senberoAvailable: false, soloFriendliness: 9 },
  { id: "spot_demo_ike_wine", name: "ワイン酒場・◇◆", category: "SOLO_NOMI", subCategories: ["ワイン", "立ち飲み"], address: "東京都豊島区テスト2-3-3", tagline: "立ち飲みでグラス500円から。回転が速い", latitude: 35.7304, longitude: 139.7088, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 8 },
  { id: "spot_demo_ike_yakitori", name: "焼き鳥・▲▽", category: "SOLO_NOMI", subCategories: ["ビール"], address: "東京都豊島区テスト3-2-2", tagline: "カウンター8席のみ。大将と無言でも許される空気", latitude: 35.7318, longitude: 139.7096, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 8 },
  { id: "spot_demo_ike_bar", name: "バー・◆◇", category: "SOLO_NOMI", subCategories: ["ワイン", "女性ひとり歓迎"], address: "東京都豊島区テスト3-3-3", tagline: "薄暗く静か。一人で長居しても声をかけられない", latitude: 35.7276, longitude: 139.7124, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 7 },
  { id: "spot_demo_ike_kakuuchi", name: "角打ち・▽◇", category: "SOLO_NOMI", subCategories: ["立ち飲み", "日本酒", "ビール"], address: "東京都豊島区テスト4-1-1", tagline: "酒屋の一角。缶ビール1本から店内で飲める", latitude: 35.7289, longitude: 139.7078, hasCounterSeat: true, senberoAvailable: true, soloFriendliness: 9 },
  { id: "spot_demo_ike_meshi", name: "一人定食・○△", category: "SOLO_MESHI", subCategories: [], address: "東京都豊島区テスト3-1-1", tagline: "全席カウンター。15分で食べて出られる", latitude: 35.7281, longitude: 139.7152, hasCounterSeat: true, senberoAvailable: false, soloFriendliness: 10 },
];

async function main() {
  for (const spot of DEMO_SPOTS) {
    // 推し文は後から追記した項目なので、既存行にも行き渡るよう update 側にも入れる
    await prisma.spot.upsert({
      where: { id: spot.id },
      update: { tagline: spot.tagline },
      create: spot,
    });
  }
  console.log(`seed完了: デモ店舗${DEMO_SPOTS.length}件を作成/更新しました`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

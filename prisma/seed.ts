import { PrismaClient, type Category } from "@prisma/client";

const prisma = new PrismaClient();

// 動作確認用のダミー店舗。実在の店ではないため、名前は記号のままにしてある。
// 距離順の絞り込みと場所切り替えを体感できるよう、渋谷・池袋の2エリアに分けて配置する。
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

  // 池袋エリアは実店舗データ投入済み(data/spots-ikebukuro.json等)のため、
  // ここには仮データを置かない。
];

// 実店舗データ投入により不要になった、旧・池袋エリアの仮データID。
// prisma db seed はビルドのたびに実行されるため、DEMO_SPOTSから外すだけでは
// 既存レコードが残ってしまう。ここに列挙してmain()で明示的に削除する。
const OBSOLETE_DEMO_SPOT_IDS = [
  "spot_demo_ike_tachinomi",
  "spot_demo_ike_sake",
  "spot_demo_ike_sauna",
  "spot_demo_ike_karaoke",
  "spot_demo_ike_wine",
  "spot_demo_ike_yakitori",
  "spot_demo_ike_bar",
  "spot_demo_ike_kakuuchi",
  "spot_demo_ike_meshi",
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
  try {
    const { count } = await prisma.spot.deleteMany({
      where: { id: { in: OBSOLETE_DEMO_SPOT_IDS } },
    });
    console.log(`seed完了: デモ店舗${DEMO_SPOTS.length}件を作成/更新、旧仮データ${count}件を削除しました`);
  } catch (e) {
    // 来店ログ等から参照されているとFK制約で削除できない場合がある。
    // ビルド自体は止めず、警告だけ出して続行する。
    console.warn("旧仮データの削除に失敗しました(参照が残っている可能性):", e);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

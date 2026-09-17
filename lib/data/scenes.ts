// 検索シーン(ソロ/デート/グループ)の定義。ソロを既定にして、見出しとモードチップの
// 中身をシーンごとに差し替える。ナビのタブは増やさず、トップ画面の中で切り替える。
//
// デート・グループはSpotSceneに行がある店だけを対象にするため(APIのsceneパラメータ)、
// 店舗データの収集が済むまでは0件になる。モードの選択肢は「押して実際に効くもの」だけを
// 置く方針に従い、すべてDBの列に対応させてある(個室=hasPrivateRoom、
// 飲み放題=hasAllYouCanDrink、コース=hasCourse、貸切=canCharter)。
// グループの人数指定は絞り込みの形が違う(チップではなくフォーム)ため、別途対応する。

export const SCENE_KEYS = ["SOLO", "DATE", "GROUP"] as const;
export type SceneKey = (typeof SCENE_KEYS)[number];

export type SceneDef = {
  key: SceneKey;
  label: string;
  heading: string;
  modes: string[];
  // 対象の店が1件も無いときの案内。ソロは実データがあるので基準地の問題として扱い、持たせない
  comingSoonNote?: string;
};

export const SCENES: SceneDef[] = [
  {
    key: "SOLO",
    label: "ソロ",
    heading: "今夜のおすすめ3軒",
    modes: ["カウンター席", "立ち飲み", "せんべろ", "日本酒", "ワイン", "ビール", "女性ひとり歓迎"],
  },
  {
    key: "DATE",
    label: "デート",
    heading: "デート向けの3軒",
    modes: ["個室", "カウンター席", "ワイン", "日本酒"],
    comingSoonNote: "デート向けのお店はまだ準備中です",
  },
  {
    key: "GROUP",
    label: "グループ",
    heading: "みんなで行ける3軒",
    modes: ["個室", "飲み放題", "コース", "貸切"],
    comingSoonNote: "グループ向けのお店はまだ準備中です",
  },
];

export const DEFAULT_SCENE: SceneKey = "SOLO";

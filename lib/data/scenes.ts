// 検索シーン(ソロ/デート/グループ)の定義。ソロを既定にして、見出しとモードチップの
// 中身をシーンごとに差し替える。ナビのタブは増やさず、トップ画面の中で切り替える。
//
// デート・グループはSpotSceneに行がある店だけを対象にするため(APIのsceneパラメータ)、
// 店舗データの整備が済むまでは0件になる。モードの選択肢は「押して実際に効くもの」だけを
// 置く方針に従い、すべてDBの列に対応させてある。
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

// 配列の並び順がそのままトップ画面のセグメント表示順になる(ソロ/グループ/デート)
export const SCENES: SceneDef[] = [
  {
    key: "SOLO",
    label: "ソロ",
    heading: "今夜のおすすめ3軒",
    modes: ["カウンター席", "立ち飲み", "せんべろ", "日本酒", "ワイン", "ビール", "女性ひとり歓迎"],
  },
  {
    // 45-65歳・2-4名想定。4人が向かい合って会話できることが要件なのでテーブル席が軸になる。
    // 飲み放題・コース・貸切は8名以上の幹事向けの条件なので、ここには置かない
    key: "GROUP",
    label: "グループ",
    heading: "みんなで行ける3軒",
    modes: ["テーブル席", "個室", "予約可"],
    comingSoonNote: "グループ向けのお店はまだ準備中です",
  },
  {
    // 35-49歳・2名想定。カウンターの横並びが武器になるので、ソロ向けの資産がそのまま効く
    key: "DATE",
    label: "デート",
    heading: "デート向けの3軒",
    modes: ["カウンター席", "個室", "予約可", "ワイン", "日本酒"],
    comingSoonNote: "デート向けのお店はまだ準備中です",
  },
];

export const DEFAULT_SCENE: SceneKey = "SOLO";

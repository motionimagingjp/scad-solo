// 「このアプリについて」画面の内容。SCAD-BEAUTYの共通フォーマットを踏襲し、
// SCAD-SOLO向けに内容だけ差し替えたもの。他のSCADアプリを増やす際もこの形をコピーすればいい。
export type AboutFeature = { emoji: string; label: string; desc: string };
export type AboutSns = { label: string; url: string };

export const APP_ABOUT = {
  avatarImage: "/images/profile-avatar.jpg",
  name: "はじめまして",
  tagline: "一人でも気兼ねなく行ける店を、すぐに見つけられるように。",
  story:
    "一人で飲みに行きたい日はあるのに、「入りにくそう」「浮きそう」で結局いつもの店に戻ってしまう。そんな経験から、カウンター席があって一人客に慣れた店だけを集めたら、もっと気軽に新しい店に挑戦できるはずだと思い、個人でこのアプリを開発しています。",
  appIntro:
    "Tokyo Solo Clubは、一人飲みに向いている店だけを絞り込んで提案する、ソロ活・ソロ飲み専用のナビアプリです。",
  appFeatures: [
    { emoji: "🍶", label: "今夜のおすすめ3軒", desc: "現在地から近いソロ向けの3軒をすぐ提案" },
    { emoji: "🗺️", label: "地図", desc: "せんべろ・ワインなど気分に合わせて周辺の店を一覧" },
    { emoji: "🎲", label: "ゲーム", desc: "一人でも、複数人でも楽しめるソロ活アクティビティ" },
  ] satisfies AboutFeature[],
  dataNote:
    "現在地は近くの店を探すためだけに使われ、位置情報そのものが保存されることはありません。来店ログやランクなどのソロ活の記録は、あなたの活動履歴としてこのアプリに保存されます。",
  sns: [
    { label: "X (旧Twitter)", url: "https://x.com/jakeimages" },
  ] satisfies AboutSns[],
};

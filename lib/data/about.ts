// 「このアプリについて」画面の内容。SCAD-BEAUTYの共通フォーマットを踏襲し、
// SCAD-SOLO向けに内容だけ差し替えたもの。他のSCADアプリを増やす際もこの形をコピーすればいい。
//
// 「私について」「お問い合わせ・SNS」はMOTION IMAGINGシリーズ共通データ(lib/getSharedAbout)
// を使うため、ここではアプリ固有の内容のみを持つ。
import { BRAND } from "@/lib/brand";

export type AboutFeature = { emoji: string; label: string; desc: string };

export const APP_ABOUT = {
  avatarImage: "/images/profile-avatar.jpg",
  tagline: "一人でも気兼ねなく行ける店を、すぐに見つけられるように。",
  appIntro:
    `${BRAND.appName}は、一人飲みに向いている店だけを絞り込んで提案する、ソロ活・ソロ飲み専用のナビアプリです。`,
  appFeatures: [
    { emoji: "🍶", label: "今夜のおすすめ3軒", desc: "現在地から近いソロ向けの3軒をすぐ提案" },
    { emoji: "🗺️", label: "地図", desc: "せんべろ・ワインなど気分に合わせて周辺の店を一覧" },
    { emoji: "🎲", label: "ゲーム", desc: "一人でも、複数人でも楽しめるソロ活アクティビティ" },
  ] satisfies AboutFeature[],
  dataNote:
    "現在地は近くの店を探すためだけに使われ、位置情報そのものが保存されることはありません。来店ログやランクなどのソロ活の記録は、あなたの活動履歴としてこのアプリに保存されます。",
};

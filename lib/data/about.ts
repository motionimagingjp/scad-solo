// 「このアプリについて」画面の内容。SCAD-BEAUTYの共通フォーマットを踏襲し、
// SCAD-SOLO向けに内容だけ差し替えたもの。他のSCADアプリを増やす際もこの形をコピーすればいい。
import { BRAND } from "@/lib/brand";

export type AboutFeature = { emoji: string; label: string; desc: string };
// url が null のSNSはアイコンのみ表示し、リンクを張らない(デモ版で使用)
export type AboutSns = { label: string; url: string | null };

export const APP_ABOUT = {
  avatarImage: "/images/profile-avatar.jpg",
  name: "はじめまして",
  tagline: "一人でも、誰かとでも。今夜行ける店を、すぐに見つけられるように。",
  story: BRAND.story,
  appIntro:
    `${BRAND.appName}は、ソロ・グループ・デートのシーンに合わせて店を絞り込んで提案する、今夜の店探しナビアプリです。`,
  appFeatures: [
    { emoji: "🍶", label: "今夜のおすすめ3軒", desc: "現在地から近い、シーンに合った3軒をすぐ提案" },
    { emoji: "🗺️", label: "地図", desc: "せんべろ・ワインなど気分に合わせて周辺の店を一覧" },
    { emoji: "🎲", label: "ゲーム", desc: "一人でも、複数人でも楽しめるアクティビティ" },
  ] satisfies AboutFeature[],
  dataNote:
    "現在地は近くの店を探すためだけに使われ、位置情報そのものが保存されることはありません。来店ログやランクなどのソロ活の記録は、あなたの活動履歴としてこのアプリに保存されます。",
  sns: BRAND.sns satisfies AboutSns[],
};

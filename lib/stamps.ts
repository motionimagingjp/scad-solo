export type StampDesign = { id: string; emoji: string; label: string };

export const STAMP_DESIGNS: StampDesign[] = [
  { id: "cheers", emoji: "🍻", label: "今夜も一人乾杯" },
  { id: "counter", emoji: "🪑", label: "カウンター制覇" },
  { id: "adventure", emoji: "🧭", label: "新規開拓" },
  { id: "night", emoji: "🌙", label: "夜のソロ活" },
  { id: "senbero", emoji: "💴", label: "せんべろデビュー" },
  { id: "regular", emoji: "⭐", label: "常連ムーブ" },
];

/** 来店ログIDから決定論的に選出(同じログには常に同じスタンプ) */
export function pickStampDesign(visitLogId: string): StampDesign {
  let hash = 0;
  for (let i = 0; i < visitLogId.length; i++) hash = (hash * 31 + visitLogId.charCodeAt(i)) >>> 0;
  return STAMP_DESIGNS[hash % STAMP_DESIGNS.length];
}

export const HASHTAG_LIMIT = 3;

/** ハッシュタグは必ず3つ以内に切り詰め、重複と#抜けを補正する(規約をコードで担保) */
export function normalizeHashtags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().replace(/^#*/, "#");
    if (t.length > 1 && !seen.has(t)) { seen.add(t); out.push(t); }
    if (out.length >= HASHTAG_LIMIT) break;
  }
  return out;
}

export type SharePayload = { text: string; hashtags: string[]; intentUrl: string };

/** Threads共有ペイロード。intentUrl をそのまま開けば投稿画面に遷移する(Web/iOS共通) */
export function buildThreadsSharePayload(params: { spotName: string; stamp: StampDesign }): SharePayload {
  const { spotName, stamp } = params;
  const text = `${stamp.emoji}「${spotName}」でソロ活達成!スタンプ「${stamp.label}」をゲット。1人の時間、最高。`;
  const hashtags = normalizeHashtags(["#ソロ活", "#ソロ飲み", "#SCADSOLO"]);
  const intentUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n${hashtags.join(" ")}`)}`;
  return { text, hashtags, intentUrl };
}

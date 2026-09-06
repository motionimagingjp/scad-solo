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
export function buildThreadsSharePayload(params: { spotName: string; visitCount: number }): SharePayload {
  const { spotName, visitCount } = params;
  const text = `🍶「${spotName}」で今夜のソロ活。通算${visitCount}回目。一人の時間、最高。`;
  const hashtags = normalizeHashtags(["#ソロ活", "#ソロ飲み", "#SCADSOLO"]);
  const intentUrl = `https://www.threads.net/intent/post?text=${encodeURIComponent(`${text}\n${hashtags.join(" ")}`)}`;
  return { text, hashtags, intentUrl };
}

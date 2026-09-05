// ランク・実績のビジネスロジック。API/ビューのどちらからも参照し、SwiftUI移植時はこのファイルの仕様をそのまま移す。
import { RANK_THRESHOLDS, ANNIVERSARY_MILESTONES, REGULAR_VISITS_PER_SPOT } from "@/lib/data/scadApps";

export type SoloRank = "BEGINNER" | "REGULAR" | "MASTER";

export function calcRank(visitCount: number): SoloRank {
  if (visitCount >= RANK_THRESHOLDS.MASTER.min) return "MASTER";
  if (visitCount >= RANK_THRESHOLDS.REGULAR.min) return "REGULAR";
  return "BEGINNER";
}

export type NewAchievement = { key: string; label: string };

/** 来店数ベースの記念日のうち、まだ付与されていないものを返す(複数またぎに対応) */
export function detectVisitMilestones(visitCount: number, achievedKeys: Set<string>): NewAchievement[] {
  return ANNIVERSARY_MILESTONES
    .filter((m) => m.count <= visitCount && !achievedKeys.has(`visit:${m.count}`))
    .map((m) => ({ key: `visit:${m.count}`, label: m.label }));
}

/** 同一店の来店回数が規定回数に達した瞬間だけ「常連」実績を返す */
export function detectRegularBadge(spotId: string, spotName: string, visitsAtSpot: number, achievedKeys: Set<string>): NewAchievement | null {
  const key = `regular:${spotId}`;
  if (visitsAtSpot >= REGULAR_VISITS_PER_SPOT && !achievedKeys.has(key)) {
    return { key, label: `${spotName} の常連` };
  }
  return null;
}

import type { Milestone } from "@/lib/data/scadApps";

export default function AnniversaryBanner({
  milestone,
}: {
  milestone: Milestone | null;
}) {
  if (!milestone) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 p-4 text-white shadow">
      <p className="text-xs opacity-90">🎉 記念日達成</p>
      <p className="mt-1 text-lg font-bold">{milestone.label}</p>
      <p className="mt-1 text-sm opacity-90">{milestone.message}</p>
    </div>
  );
}

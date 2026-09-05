import { STAMP_DESIGNS } from "@/lib/stamps";

type CollectedStamp = {
  designId: string;
  createdAt: string; // ISO date
};

export default function StampCard({
  collected,
}: {
  collected: CollectedStamp[];
}) {
  const collectedIds = new Set(collected.map((s) => s.designId));

  return (
    <div className="grid grid-cols-3 gap-3">
      {STAMP_DESIGNS.map((design) => {
        const owned = collectedIds.has(design.id);
        return (
          <div
            key={design.id}
            className={`flex flex-col items-center rounded-xl border p-3 ${
              owned ? "bg-orange-50" : "bg-gray-50 opacity-40"
            }`}
          >
            <span className="text-2xl">{design.emoji}</span>
            <span className="mt-1 text-center text-[10px] text-gray-500">
              {design.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

-- CreateEnum
CREATE TYPE "Scene" AS ENUM ('SOLO', 'DATE', 'GROUP', 'LUXURY');

-- AlterTable
ALTER TABLE "Spot" ADD COLUMN     "geocodePlaceId" TEXT,
ADD COLUMN     "geocodedAt" TIMESTAMP(3),
ADD COLUMN     "maxGroupSize" INTEGER,
ADD COLUMN     "hasPrivateRoom" BOOLEAN,
ADD COLUMN     "hasAllYouCanDrink" BOOLEAN,
ADD COLUMN     "hasCourse" BOOLEAN,
ADD COLUMN     "canCharter" BOOLEAN,
ADD COLUMN     "groupInfoVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SpotScene" (
    "id" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "scene" "Scene" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 5,
    "reason" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpotScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SpotScene_scene_score_idx" ON "SpotScene"("scene", "score");

-- CreateIndex
CREATE UNIQUE INDEX "SpotScene_spotId_scene_key" ON "SpotScene"("spotId", "scene");

-- AddForeignKey
ALTER TABLE "SpotScene" ADD CONSTRAINT "SpotScene_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DataMigration: 既存のSpot.soloFriendlinessをSpotScene(scene=SOLO)へコピー
-- 冪等(ON CONFLICT DO NOTHING)なので再実行しても安全
INSERT INTO "SpotScene" ("id", "spotId", "scene", "score", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", 'SOLO', "soloFriendliness", now(), now()
FROM "Spot"
ON CONFLICT ("spotId", "scene") DO NOTHING;

-- CreateEnum
CREATE TYPE "SpotStatus" AS ENUM ('ACTIVE', 'NEEDS_REVIEW', 'CLOSED');

-- AlterTable
ALTER TABLE "Spot" ADD COLUMN     "googlePlaceId" TEXT,
ADD COLUMN     "lastVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "nearestStation" TEXT,
ADD COLUMN     "sourceNote" TEXT,
ADD COLUMN     "status" "SpotStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX "Spot_googlePlaceId_key" ON "Spot"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Spot_nearestStation_idx" ON "Spot"("nearestStation");

-- CreateIndex
CREATE INDEX "Spot_status_idx" ON "Spot"("status");


-- CreateEnum
CREATE TYPE "Category" AS ENUM ('SOLO_NOMI', 'SOLO_MESHI', 'SOLO_SPOT');

-- CreateEnum
CREATE TYPE "SoloRank" AS ENUM ('BEGINNER', 'REGULAR', 'MASTER');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "soloRank" "SoloRank" NOT NULL DEFAULT 'BEGINNER',
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL,
    "subCategories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "hasCounterSeat" BOOLEAN NOT NULL DEFAULT true,
    "senberoAvailable" BOOLEAN NOT NULL DEFAULT false,
    "soloFriendliness" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Spot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "spotId" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "comment" TEXT,
    "imageUrl" TEXT,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stamp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "visitLogId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "achievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE INDEX "Spot_category_idx" ON "Spot"("category");

-- CreateIndex
CREATE INDEX "Spot_latitude_longitude_idx" ON "Spot"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "Spot_subCategories_idx" ON "Spot" USING GIN ("subCategories");

-- CreateIndex
CREATE INDEX "Event_startDate_endDate_idx" ON "Event"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "Event_latitude_longitude_idx" ON "Event"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "VisitLog_userId_spotId_idx" ON "VisitLog"("userId", "spotId");

-- CreateIndex
CREATE UNIQUE INDEX "Stamp_visitLogId_key" ON "Stamp"("visitLogId");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_notified_idx" ON "UserAchievement"("userId", "notified");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_key_key" ON "UserAchievement"("userId", "key");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitLog" ADD CONSTRAINT "VisitLog_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "Spot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stamp" ADD CONSTRAINT "Stamp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stamp" ADD CONSTRAINT "Stamp_visitLogId_fkey" FOREIGN KEY ("visitLogId") REFERENCES "VisitLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;


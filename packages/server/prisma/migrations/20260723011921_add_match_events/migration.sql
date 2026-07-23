-- CreateEnum
CREATE TYPE "MatchEventType" AS ENUM ('GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUB_IN', 'SUB_OUT');

-- AlterTable
ALTER TABLE "Formation" ADD COLUMN     "matchDate" TIMESTAMP(3),
ADD COLUMN     "opponent" TEXT,
ADD COLUMN     "scoreAway" INTEGER,
ADD COLUMN     "scoreHome" INTEGER;

-- AlterTable
ALTER TABLE "FormationPlayer" ADD COLUMN     "isSubstitute" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subInMinute" INTEGER,
ADD COLUMN     "subOutMinute" INTEGER;

-- CreateTable
CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "eventType" "MatchEventType" NOT NULL,
    "minute" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchEvent_formationId_idx" ON "MatchEvent"("formationId");

-- CreateIndex
CREATE INDEX "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

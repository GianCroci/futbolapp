-- CreateTable
CREATE TABLE "Substitution" (
    "id" TEXT NOT NULL,
    "formationId" TEXT NOT NULL,
    "playerOutId" TEXT NOT NULL,
    "playerInId" TEXT NOT NULL,
    "minute" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Substitution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Substitution_formationId_idx" ON "Substitution"("formationId");

-- CreateIndex
CREATE INDEX "Substitution_playerOutId_idx" ON "Substitution"("playerOutId");

-- CreateIndex
CREATE INDEX "Substitution_playerInId_idx" ON "Substitution"("playerInId");

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_formationId_fkey" FOREIGN KEY ("formationId") REFERENCES "Formation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_playerOutId_fkey" FOREIGN KEY ("playerOutId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Substitution" ADD CONSTRAINT "Substitution_playerInId_fkey" FOREIGN KEY ("playerInId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

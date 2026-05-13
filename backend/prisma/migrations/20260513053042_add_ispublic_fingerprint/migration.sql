-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Submission" ADD COLUMN     "fingerprintId" TEXT;

-- CreateIndex
CREATE INDEX "Poll_isPublic_isPublished_idx" ON "Poll"("isPublic", "isPublished");

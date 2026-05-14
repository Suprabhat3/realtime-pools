-- DropIndex
DROP INDEX "Poll_isPublic_isPublished_idx";

-- AlterTable
ALTER TABLE "Poll" ADD COLUMN     "isAnnounced" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Poll_isPublic_isPublished_isAnnounced_idx" ON "Poll"("isPublic", "isPublished", "isAnnounced");

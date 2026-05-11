-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "birthday" TIMESTAMP(3),
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "imageFileId" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "timezone" TEXT;

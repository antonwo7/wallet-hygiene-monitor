-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailMinRiskScore" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "emailNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true;

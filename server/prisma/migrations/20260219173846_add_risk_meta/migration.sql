/*
  Warnings:

  - The values [ETHEREUM,POLYGON,ARBITRUM] on the enum `Chain` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `riskReasons` on the `ApprovalEvent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[eventId,channel]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterEnum
BEGIN;
CREATE TYPE "Chain_new" AS ENUM ('ethereum', 'polygon', 'arbitrum');
ALTER TABLE "Wallet" ALTER COLUMN "chain" TYPE "Chain_new" USING ("chain"::text::"Chain_new");
ALTER TABLE "ApprovalEvent" ALTER COLUMN "chain" TYPE "Chain_new" USING ("chain"::text::"Chain_new");
ALTER TYPE "Chain" RENAME TO "Chain_old";
ALTER TYPE "Chain_new" RENAME TO "Chain";
DROP TYPE "public"."Chain_old";
COMMIT;

-- AlterTable
ALTER TABLE "ApprovalEvent" DROP COLUMN "riskReasons",
ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'LOW',
ADD COLUMN     "riskMeta" JSONB NOT NULL DEFAULT '{}';

-- CreateIndex
CREATE INDEX "ApprovalEvent_riskLevel_createdAt_idx" ON "ApprovalEvent"("riskLevel", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalEvent_walletId_riskLevel_createdAt_idx" ON "ApprovalEvent"("walletId", "riskLevel", "createdAt");

-- CreateIndex
CREATE INDEX "ApprovalEvent_walletId_chain_createdAt_idx" ON "ApprovalEvent"("walletId", "chain", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_eventId_channel_key" ON "Notification"("eventId", "channel");

-- CreateEnum
CREATE TYPE "BackfillStatus" AS ENUM ('pending', 'running', 'done', 'error');

-- AlterTable
ALTER TABLE "WalletState" ADD COLUMN     "backfillError" TEXT,
ADD COLUMN     "backfillFinishedAt" TIMESTAMP(3),
ADD COLUMN     "backfillStartedAt" TIMESTAMP(3),
ADD COLUMN     "backfillStatus" "BackfillStatus" NOT NULL DEFAULT 'pending';

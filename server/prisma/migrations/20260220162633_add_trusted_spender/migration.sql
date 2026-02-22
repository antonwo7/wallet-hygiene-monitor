-- CreateTable
CREATE TABLE "TrustedSpender" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chain" "Chain" NOT NULL,
    "spender" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedSpender_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrustedSpender_userId_chain_idx" ON "TrustedSpender"("userId", "chain");

-- CreateIndex
CREATE UNIQUE INDEX "TrustedSpender_userId_chain_spender_key" ON "TrustedSpender"("userId", "chain", "spender");

-- AddForeignKey
ALTER TABLE "TrustedSpender" ADD CONSTRAINT "TrustedSpender_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

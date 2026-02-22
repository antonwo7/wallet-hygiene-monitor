import { PrismaService } from 'src/shared/prisma/prisma.service'

let prisma: PrismaService | null = null

function requireDatabaseUrl() {
	const url = process.env.DATABASE_URL
	if (!url) {
		throw new Error(
			[
				'DATABASE_URL is not set.',
				'Integration tests require a real PostgreSQL database.',
				'Example:',
				'  set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wallet_hygiene_test?schema=public',
				'  npx prisma migrate deploy',
				'  npx jest -c tests/jest.int.config.cjs'
			].join('\n')
		)
	}
}

export async function getPrisma(): Promise<PrismaService> {
	requireDatabaseUrl()
	if (!prisma) {
		prisma = new PrismaService()
		await prisma.onModuleInit()
	}
	return prisma
}

export async function resetDb() {
	const p = await getPrisma()
	// Fast & deterministic cleanup. CASCADE handles relations.
	await p.client.$executeRawUnsafe(`
      TRUNCATE TABLE
        "Notification",
        "TrustedSpender",
        "ApprovalEvent",
        "WalletState",
        "Wallet",
        "PasswordResetToken",
        "User"
      RESTART IDENTITY CASCADE;
    `)
}

export async function disconnectDb() {
	if (prisma) {
		await prisma.onModuleDestroy()
		prisma = null
	}
}

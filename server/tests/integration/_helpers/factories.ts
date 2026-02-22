import { Chain, WalletStatus, type Prisma } from '@prisma/client'
import { getPrisma } from './db'

export async function createUser(overrides?: Partial<Prisma.UserCreateInput>) {
	const prisma = await getPrisma()
	return prisma.client.user.create({
		data: {
			nickname: 'nick',
			email: 'e@mail.com',
			firstName: 'F',
			lastName: 'L',
			passwordHash: 'hash',
			...(overrides ?? {})
		}
	})
}

export async function createWallet(params: { userId: string; chain?: Chain; address?: string; status?: WalletStatus }) {
	const prisma = await getPrisma()
	return prisma.client.wallet.create({
		data: {
			userId: params.userId,
			chain: params.chain ?? Chain.ethereum,
			address: (params.address ?? '0xabc').toLowerCase(),
			status: params.status ?? WalletStatus.ACTIVE,
			state: { create: { lastScannedBlock: 0n } }
		},
		include: { state: true }
	})
}

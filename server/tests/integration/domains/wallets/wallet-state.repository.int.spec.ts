import { WalletStateRepository } from 'src/domains/wallets/repositories/wallet-state.repository'
import { WalletsRepository } from 'src/domains/wallets/repositories/wallets.repository'
import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { Chain } from '@prisma/client'
import { NotFoundException } from '@nestjs/common'
import { RepoNotFoundError } from 'src/shared/errors/repo-errors'
import { getPrisma } from '../../_helpers/db'

describe('WalletStateRepository (integration)', () => {
	let prisma: PrismaService
	let repo: WalletStateRepository
	let walletsRepo: WalletsRepository
	let usersRepo: UsersRepository
	let userId: string
	let walletId: string

	beforeAll(async () => {
		prisma = await getPrisma()
		repo = new WalletStateRepository(prisma)
		walletsRepo = new WalletsRepository(prisma)
		usersRepo = new UsersRepository(prisma)
	})

	beforeEach(async () => {
		const u = await usersRepo.create({
			nickname: 'nick',
			email: 'e@mail.com',
			firstName: 'F',
			lastName: 'L',
			passwordHash: 'hash'
		})
		userId = u.id
		walletId = (await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0xabc' })).id
	})

	it('updateByWalletId updates record', async () => {
		const updated = await repo.updateByWalletId(walletId, { lastScannedBlock: 123n })
		expect(updated.lastScannedBlock).toBe(123n)
	})

	it('updateByWalletId with empty data returns existing', async () => {
		const existing = await repo.updateByWalletId(walletId, {})
		expect(existing.walletId).toBe(walletId)
	})

	it('throws NotFound when walletState missing', async () => {
		await prisma.client.walletState.delete({ where: { walletId } })
		await expect(repo.updateByWalletId(walletId, {})).rejects.toBeInstanceOf(NotFoundException)
		// PrismaService maps P2025 into RepoNotFoundError before it reaches repository catch-block
		await expect(repo.updateByWalletId(walletId, { lastScannedBlock: 1n })).rejects.toBeInstanceOf(
			RepoNotFoundError
		)
	})
})

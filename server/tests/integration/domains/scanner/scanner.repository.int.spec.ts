import { ScannerRepository } from 'src/domains/scanner/scanner.repository'
import { WalletsRepository } from 'src/domains/wallets/repositories/wallets.repository'
import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { Chain, WalletStatus } from '@prisma/client'
import { getPrisma } from '../../_helpers/db'

describe('ScannerRepository (integration)', () => {
	let prisma: PrismaService
	let repo: ScannerRepository
	let walletsRepo: WalletsRepository
	let usersRepo: UsersRepository
	let userId: string
	let activeWalletId: string

	beforeAll(async () => {
		prisma = await getPrisma()
		repo = new ScannerRepository(prisma)
		walletsRepo = new WalletsRepository(prisma)
		usersRepo = new UsersRepository(prisma)
	})

	beforeEach(async () => {
		userId = (
			await usersRepo.create({
				nickname: 'nick',
				email: 'e@mail.com',
				firstName: 'F',
				lastName: 'L',
				passwordHash: 'hash'
			})
		).id

		// settings are updated via dedicated repo method
		await usersRepo.updateUserSettings(userId, {
			emailNotificationsEnabled: true,
			emailMinRiskScore: 3
		})

		activeWalletId = (
			await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0x1' })
		).id

		const disabled = await walletsRepo.createWithState({ userId, chain: Chain.polygon, address: '0x2' })
		await walletsRepo.setStatus(disabled.id, userId, WalletStatus.DISABLED)
	})

	it('getActiveWallets returns only ACTIVE wallets with state and user settings', async () => {
		const list = await repo.getActiveWallets()
		expect(list).toHaveLength(1)
		expect(list[0].id).toBe(activeWalletId)
		expect(list[0].state).toBeTruthy()
		expect(list[0].user.emailMinRiskScore).toBe(3)
	})

	it('updateLastScannedBlock updates walletState by walletId', async () => {
		const updated = await repo.updateLastScannedBlock(activeWalletId, 999n)
		expect(updated.lastScannedBlock).toBe(999n)
	})
})

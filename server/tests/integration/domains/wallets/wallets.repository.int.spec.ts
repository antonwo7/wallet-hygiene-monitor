import { WalletsRepository } from 'src/domains/wallets/repositories/wallets.repository'
import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { RepoUniqueViolationError } from 'src/shared/errors/repo-errors'
import { Chain, WalletStatus } from '@prisma/client'
import { getPrisma } from '../../_helpers/db'

describe('WalletsRepository (integration)', () => {
	let prisma: PrismaService
	let walletsRepo: WalletsRepository
	let usersRepo: UsersRepository
	let userId: string

	beforeAll(async () => {
		prisma = await getPrisma()
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
	})

	it('createWithState creates Wallet + WalletState', async () => {
		const w = await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0xabc' })
		expect(w.state).toBeTruthy()
		expect(w.state?.lastScannedBlock).toBe(0n)
	})

	it('enforces unique(userId, chain, address) and maps error', async () => {
		await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0xabc' })
		await expect(
			walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0xabc' })
		).rejects.toBeInstanceOf(RepoUniqueViolationError)
	})

	it('findManyByUser orders by createdAt desc and includes state', async () => {
		await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0x1' })
		await new Promise(r => setTimeout(r, 5))
		await walletsRepo.createWithState({ userId, chain: Chain.polygon, address: '0x2' })
		const list = await walletsRepo.findManyByUser(userId)
		expect(list.length).toBe(2)
		expect(list[0].chain).toBe(Chain.polygon)
		expect(list[0].state).toBeTruthy()
	})

	it('setStatus updates only wallet for given user', async () => {
		const w = await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0xabc' })
		const res = await walletsRepo.setStatus(w.id, userId, WalletStatus.DISABLED)
		expect(res.count).toBe(1)

		const fetched = await walletsRepo.findByIdForUser(w.id, userId)
		expect(fetched?.status).toBe(WalletStatus.DISABLED)
	})

	it('getUserIdsByWalletIds returns map', async () => {
		const w1 = await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0x1' })
		const w2 = await walletsRepo.createWithState({ userId, chain: Chain.polygon, address: '0x2' })
		const map = await walletsRepo.getUserIdsByWalletIds([w1.id, w2.id])
		expect(map.get(w1.id)).toBe(userId)
		expect(map.get(w2.id)).toBe(userId)
	})
})

import { AllowlistRepository } from 'src/domains/allowlist/allowlist.repository'
import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { Chain } from '@prisma/client'
import { getPrisma } from '../../_helpers/db'

describe('AllowlistRepository (integration)', () => {
	let prisma: PrismaService
	let repo: AllowlistRepository
	let usersRepo: UsersRepository
	let userId: string

	beforeAll(async () => {
		prisma = await getPrisma()
		repo = new AllowlistRepository(prisma)
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
	})

	it('upsertOne creates then updates label', async () => {
		const created = await repo.upsertOne({ userId, chain: Chain.ethereum, spender: '0xabc', label: 'A' })
		expect(created.label).toBe('A')

		const updated = await repo.upsertOne({ userId, chain: Chain.ethereum, spender: '0xabc', label: 'B' })
		expect(updated.id).toBe(created.id)
		expect(updated.label).toBe('B')
	})

	it('list filters by chain and orders desc', async () => {
		await repo.upsertOne({ userId, chain: Chain.ethereum, spender: '0x1' })
		await new Promise(r => setTimeout(r, 5))
		await repo.upsertOne({ userId, chain: Chain.polygon, spender: '0x2' })

		const all = await repo.list(userId)
		expect(all.length).toBe(2)
		expect(all[0].spender).toBe('0x2')

		const ethOnly = await repo.list(userId, Chain.ethereum)
		expect(ethOnly.length).toBe(1)
		expect(ethOnly[0].spender).toBe('0x1')
	})

	it('findTrusted returns set of existing spenders', async () => {
		await repo.upsertOne({ userId, chain: Chain.ethereum, spender: '0xabc' })
		await repo.upsertOne({ userId, chain: Chain.ethereum, spender: '0xdef' })

		const found = await repo.findTrusted(userId, Chain.ethereum, ['0xabc', '0xnope', '0xdef'])
		expect(found).toEqual(new Set(['0xabc', '0xdef']))
	})

	it('deleteOne returns count', async () => {
		await repo.upsertOne({ userId, chain: Chain.ethereum, spender: '0xabc' })
		expect(await repo.deleteOne({ userId, chain: Chain.ethereum, spender: '0xabc' })).toBe(1)
		expect(await repo.deleteOne({ userId, chain: Chain.ethereum, spender: '0xabc' })).toBe(0)
	})
})

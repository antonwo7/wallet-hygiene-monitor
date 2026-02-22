import { ApprovalsRepository } from 'src/domains/approvals/approvals.repository'
import { WalletsRepository } from 'src/domains/wallets/repositories/wallets.repository'
import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { ApprovalKind, Chain, RiskLevel } from '@prisma/client'
import { getPrisma } from '../../_helpers/db'

describe('ApprovalsRepository (integration)', () => {
	let prisma: PrismaService
	let repo: ApprovalsRepository
	let walletsRepo: WalletsRepository
	let usersRepo: UsersRepository
	let userId: string
	let walletId: string

	beforeAll(async () => {
		prisma = await getPrisma()
		repo = new ApprovalsRepository(prisma)
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
		walletId = (await walletsRepo.createWithState({ userId, chain: Chain.ethereum, address: '0xabc' })).id
	})

	it('createManyAndFind inserts events and returns created rows', async () => {
		const events = [
			{
				walletId,
				chain: Chain.ethereum,
				kind: ApprovalKind.ERC20_APPROVAL,
				tokenAddress: '0xtoken',
				spender: '0xspender',
				rawValue: '1',
				approved: null,
				txHash: '0xtx1',
				blockNumber: 10n,
				logIndex: 0
			},
			{
				walletId,
				chain: Chain.ethereum,
				kind: ApprovalKind.APPROVAL_FOR_ALL,
				tokenAddress: '0xnft',
				spender: '0xop',
				rawValue: null,
				approved: true,
				txHash: '0xtx2',
				blockNumber: 11n,
				logIndex: 1
			}
		]

		const created = await repo.createManyAndFind(events)
		expect(created).toHaveLength(2)
		expect(created.map(e => e.txHash).sort()).toEqual(['0xtx1', '0xtx2'])
	})

	it('createManyAndFind with skipDuplicates ignores duplicates by (chain, txHash, logIndex)', async () => {
		const base = {
			walletId,
			chain: Chain.ethereum,
			kind: ApprovalKind.ERC20_APPROVAL,
			tokenAddress: '0xtoken',
			spender: '0xspender',
			rawValue: '1',
			approved: null,
			txHash: '0xtx1',
			blockNumber: 10n,
			logIndex: 0
		}

		await repo.createManyAndFind([base])
		const created2 = await repo.createManyAndFind([base], true)
		// findAny returns existing record
		expect(created2).toHaveLength(1)
		const all = await repo.findAny([{ chain: Chain.ethereum, txHash: '0xtx1', logIndex: 0 }])
		expect(all).toHaveLength(1)
	})

	it('findFeed filters by user wallets and orders by blockNumber/logIndex desc', async () => {
		await repo.createOne({
			wallet: { connect: { id: walletId } },
			chain: Chain.ethereum,
			kind: ApprovalKind.ERC20_APPROVAL,
			tokenAddress: '0x1',
			spender: '0x2',
			rawValue: '1',
			txHash: '0xa',
			blockNumber: 10n,
			logIndex: 0,
			riskScore: 1,
			riskLevel: RiskLevel.LOW
		})

		await repo.createOne({
			wallet: { connect: { id: walletId } },
			chain: Chain.ethereum,
			kind: ApprovalKind.ERC20_APPROVAL,
			tokenAddress: '0x1',
			spender: '0x2',
			rawValue: '1',
			txHash: '0xb',
			blockNumber: 11n,
			logIndex: 5,
			riskScore: 9,
			riskLevel: RiskLevel.HIGH
		})

		const feed = await repo.findFeed({ userId, take: 10, skip: 0 })
		expect(feed).toHaveLength(2)
		expect(feed[0].blockNumber).toBe(11n)
		expect(feed[0].wallet.id).toBe(walletId)

		const filtered = await repo.findFeed({ userId, minRiskScore: 5, take: 10, skip: 0 })
		expect(filtered).toHaveLength(1)
		expect(filtered[0].riskScore).toBe(9)
	})
})

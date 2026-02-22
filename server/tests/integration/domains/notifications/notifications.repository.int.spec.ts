import { NotificationsRepository } from 'src/domains/notifications/notifications.repository'
import { ApprovalsRepository } from 'src/domains/approvals/approvals.repository'
import { WalletsRepository } from 'src/domains/wallets/repositories/wallets.repository'
import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { ApprovalKind, Chain, NotificationChannel, NotificationStatus, RiskLevel } from '@prisma/client'
import { RepoUniqueViolationError } from 'src/shared/errors/repo-errors'
import { getPrisma } from '../../_helpers/db'

describe('NotificationsRepository (integration)', () => {
	let prisma: PrismaService
	let repo: NotificationsRepository
	let approvalsRepo: ApprovalsRepository
	let walletsRepo: WalletsRepository
	let usersRepo: UsersRepository
	let userId: string
	let walletId: string
	let eventId: string

	beforeAll(async () => {
		prisma = await getPrisma()
		repo = new NotificationsRepository(prisma)
		approvalsRepo = new ApprovalsRepository(prisma)
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
		const event = await approvalsRepo.createOne({
			wallet: { connect: { id: walletId } },
			chain: Chain.ethereum,
			kind: ApprovalKind.ERC20_APPROVAL,
			tokenAddress: '0xtoken',
			spender: '0xspender',
			rawValue: '1',
			txHash: '0xtx',
			blockNumber: 10n,
			logIndex: 0,
			riskScore: 5,
			riskLevel: RiskLevel.MEDIUM
		})
		eventId = event.id
	})

	it('createPending creates notification and enforces unique(eventId, channel)', async () => {
		const n = await repo.createPending(eventId, NotificationChannel.EMAIL)
		expect(n.status).toBe(NotificationStatus.PENDING)

		await expect(repo.createPending(eventId, NotificationChannel.EMAIL)).rejects.toBeInstanceOf(
			RepoUniqueViolationError
		)
	})

	it('findPending includes event and orders asc', async () => {
		await repo.createPending(eventId, NotificationChannel.EMAIL)
		await new Promise(r => setTimeout(r, 5))
		await repo.createPending(eventId, NotificationChannel.TELEGRAM)
		const list = await repo.findPending(10)
		expect(list).toHaveLength(2)
		expect(list[0].createdAt.getTime()).toBeLessThanOrEqual(list[1].createdAt.getTime())
		expect(list[0].event.id).toBe(eventId)
	})

	it('markSent sets SENT + sentAt', async () => {
		const n = await repo.createPending(eventId, NotificationChannel.EMAIL)
		const updated = await repo.markSent(n.id)
		expect(updated.status).toBe(NotificationStatus.SENT)
		expect(updated.sentAt).toBeInstanceOf(Date)
	})

	it('markFailed increments attempts and stores lastError', async () => {
		const n = await repo.createPending(eventId, NotificationChannel.EMAIL)
		const failed1 = await repo.markFailed(n.id, 'boom')
		expect(failed1.status).toBe(NotificationStatus.FAILED)
		expect(failed1.attempts).toBe(1)
		expect(failed1.lastError).toBe('boom')

		const failed2 = await repo.markFailed(n.id, 'boom2')
		expect(failed2.attempts).toBe(2)
		expect(failed2.lastError).toBe('boom2')
	})
})

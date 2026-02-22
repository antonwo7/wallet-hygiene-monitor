import { AuthRepository } from 'src/domains/auth/auth.repository'
import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { getPrisma } from '../../_helpers/db'

describe('AuthRepository (integration)', () => {
	let prisma: PrismaService
	let repo: AuthRepository
	let usersRepo: UsersRepository
	let userId: string

	beforeAll(async () => {
		prisma = await getPrisma()
		repo = new AuthRepository(prisma)
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

	it('createPasswordResetToken + findActivePasswordResetCandidates', async () => {
		await repo.createPasswordResetToken({
			userId,
			tokenHash: 'tok1',
			expiresAt: new Date(Date.now() + 60_000)
		})

		const candidates = await repo.findActivePasswordResetCandidates(10)
		expect(candidates).toHaveLength(1)
		expect(candidates[0].userId).toBe(userId)
		// expired tokens are not returned
		await repo.createPasswordResetToken({
			userId,
			tokenHash: 'tok2',
			expiresAt: new Date(Date.now() - 60_000)
		})
		const candidates2 = await repo.findActivePasswordResetCandidates(10)
		expect(candidates2).toHaveLength(1)
	})

	it('resetPasswordTransaction updates user passwordHash and marks token usedAt', async () => {
		const token = await repo.createPasswordResetToken({
			userId,
			tokenHash: 'tok1',
			expiresAt: new Date(Date.now() + 60_000)
		})

		await repo.resetPasswordTransaction({ userId, newPasswordHash: 'new-hash', tokenId: token.id })

		const u = await usersRepo.findById(userId)
		expect(u?.passwordHash).toBe('new-hash')

		const t = await prisma.client.passwordResetToken.findUnique({ where: { id: token.id } })
		expect(t?.usedAt).toBeInstanceOf(Date)
	})
})

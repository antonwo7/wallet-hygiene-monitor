import { UsersRepository } from 'src/domains/users/users.repository'
import { PrismaService } from 'src/shared/prisma/prisma.service'
import { RepoUniqueViolationError } from 'src/shared/errors/repo-errors'
import { getPrisma } from '../../_helpers/db'

describe('UsersRepository (integration)', () => {
	let prisma: PrismaService
	let repo: UsersRepository

	beforeAll(async () => {
		prisma = await getPrisma()
		repo = new UsersRepository(prisma)
	})

	it('creates and finds by email / nickname / id', async () => {
		const created = await repo.create({
			nickname: 'nick',
			email: 'e@mail.com',
			firstName: 'F',
			lastName: 'L',
			passwordHash: 'hash'
		})

		expect((await repo.findByEmail('e@mail.com'))?.id).toBe(created.id)
		expect((await repo.findByNickname('nick'))?.id).toBe(created.id)
		expect((await repo.findById(created.id))?.email).toBe('e@mail.com')
	})

	it('enforces unique email/nickname and maps prisma error to RepoUniqueViolationError', async () => {
		await repo.create({
			nickname: 'nick',
			email: 'e@mail.com',
			firstName: 'F',
			lastName: 'L',
			passwordHash: 'hash'
		})

		await expect(
			repo.create({
				nickname: 'nick2',
				email: 'e@mail.com',
				firstName: 'F',
				lastName: 'L',
				passwordHash: 'hash'
			})
		).rejects.toBeInstanceOf(RepoUniqueViolationError)

		await expect(
			repo.create({
				nickname: 'nick',
				email: 'e2@mail.com',
				firstName: 'F',
				lastName: 'L',
				passwordHash: 'hash'
			})
		).rejects.toBeInstanceOf(RepoUniqueViolationError)
	})

	it('gets and updates user settings', async () => {
		const u = await repo.create({
			nickname: 'nick',
			email: 'e@mail.com',
			firstName: 'F',
			lastName: 'L',
			passwordHash: 'hash'
		})

		const s1 = await repo.getUserSettings(u.id)
		expect(s1?.emailNotificationsEnabled).toBe(true)
		expect(s1?.emailMinRiskScore).toBe(1)

		const s2 = await repo.updateUserSettings(u.id, {
			emailNotificationsEnabled: false,
			emailMinRiskScore: 7
		})
		expect(s2.emailNotificationsEnabled).toBe(false)
		expect(s2.emailMinRiskScore).toBe(7)
	})
})

import { PrismaService } from 'src/shared/prisma/prisma.service'
import { RepoNotFoundError } from 'src/shared/errors/repo-errors'
import { getPrisma } from '../_helpers/db'

describe('PrismaService error mapping (integration)', () => {
	let prisma: PrismaService

	beforeAll(async () => {
		prisma = await getPrisma()
	})

	it('maps P2025 to RepoNotFoundError', async () => {
		await expect(
			prisma.client.user.update({ where: { id: 'missing' }, data: { firstName: 'X' } })
		).rejects.toBeInstanceOf(RepoNotFoundError)
	})
})

import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'

@Injectable()
export class AuthRepository {
	private readonly log = new Logger('auth.repo')
	constructor(private readonly prisma: PrismaService) {}

	createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
		this.log.debug('db.passwordResetToken.create', { userId: data.userId, expiresAt: data.expiresAt })
		return this.prisma.client.passwordResetToken.create({ data })
	}

	findActivePasswordResetCandidates(limit = 50) {
		this.log.debug('db.passwordResetToken.findActiveCandidates', { limit })
		return this.prisma.client.passwordResetToken.findMany({
			where: { usedAt: null, expiresAt: { gt: new Date() } },
			orderBy: { createdAt: 'desc' },
			take: limit
		})
	}

	async resetPasswordTransaction(data: { userId: string; newPasswordHash: string; tokenId: string }) {
		this.log.debug('db.passwordResetToken.resetPasswordTx', { userId: data.userId, tokenId: data.tokenId })

		await this.prisma.client.$transaction([
			this.prisma.client.user.update({
				where: { id: data.userId },
				data: { passwordHash: data.newPasswordHash }
			}),
			this.prisma.client.passwordResetToken.update({
				where: { id: data.tokenId },
				data: { usedAt: new Date() }
			})
		])
	}
}

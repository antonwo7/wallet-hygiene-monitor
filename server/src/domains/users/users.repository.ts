import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'

@Injectable()
export class UsersRepository {
	private readonly log = new Logger('users.repo')
	constructor(private readonly prisma: PrismaService) {}

	findByEmail(email: string) {
		this.log.debug('db.user.findByEmail', { email })
		return this.prisma.client.user.findUnique({ where: { email } })
	}

	findByNickname(nickname: string) {
		this.log.debug('db.user.findByNickname', { nickname })
		return this.prisma.client.user.findUnique({ where: { nickname } })
	}

	findById(id: string) {
		this.log.debug('db.user.findById', { id })
		return this.prisma.client.user.findUnique({ where: { id } })
	}

	create(data: {
		nickname: string
		email: string
		firstName: string
		lastName: string
		passwordHash: string
	}) {
		this.log.debug('db.user.create', { email: data.email, nickname: data.nickname })
		return this.prisma.client.user.create({ data })
	}

	getUserSettings(userId: string) {
		this.log.debug('db.user.getUserSettings', { userId })
		return this.prisma.client.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				emailNotificationsEnabled: true,
				emailMinRiskScore: true
			}
		})
	}

	updateUserSettings(
		userId: string,
		data: { emailNotificationsEnabled?: boolean; emailMinRiskScore?: number }
	) {
		this.log.debug('db.user.updateUserSettings', { userId })
		return this.prisma.client.user.update({
			where: { id: userId },
			data,
			select: {
				id: true,
				email: true,
				emailNotificationsEnabled: true,
				emailMinRiskScore: true
			}
		})
	}
}

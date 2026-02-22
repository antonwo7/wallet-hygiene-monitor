import { Injectable, Logger } from '@nestjs/common'
import { NotificationChannel, NotificationStatus } from '@prisma/client'
import { PrismaService } from '../../shared/prisma/prisma.service'

@Injectable()
export class NotificationsRepository {
	private readonly log = new Logger('notifications.repo')
	constructor(private readonly prisma: PrismaService) {}

	createPending(eventId: string, channel: NotificationChannel) {
		this.log.debug('db.notification.createPending', { eventId, channel })
		return this.prisma.client.notification.create({
			data: { eventId, channel, status: NotificationStatus.PENDING }
		})
	}

	findPending(limit = 50) {
		this.log.debug('db.notification.findPending', { limit })
		return this.prisma.client.notification.findMany({
			where: { status: NotificationStatus.PENDING },
			orderBy: { createdAt: 'asc' },
			take: limit,
			include: { event: true }
		})
	}

	markSent(id: string) {
		this.log.debug('db.notification.markSent', { id })
		return this.prisma.client.notification.update({
			where: { id },
			data: { status: NotificationStatus.SENT, sentAt: new Date() }
		})
	}

	markFailed(id: string, err: string) {
		this.log.debug('db.notification.markFailed', { id })
		return this.prisma.client.notification.update({
			where: { id },
			data: {
				status: NotificationStatus.FAILED,
				attempts: { increment: 1 },
				lastError: err
			}
		})
	}
}

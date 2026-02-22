import { Injectable, Logger } from '@nestjs/common'
import { NotificationChannel } from '@prisma/client'
import { NotificationsRepository } from './notifications.repository'
import { TelegramConfig } from './telegram.config'

@Injectable()
export class NotificationsService {
	private readonly log = new Logger('notifications.worker')
	constructor(
		private readonly repo: NotificationsRepository,
		private readonly telegram: TelegramConfig
	) {}

	enqueue(eventId: string, channel: NotificationChannel) {
		this.log.log('enqueue', { eventId, channel })
		return this.repo.createPending(eventId, channel)
	}

	async processPending(limit = 25): Promise<void> {
		const items = await this.repo.findPending(limit)
		this.log.log('processPending', { pending: items.length, limit, telegramEnabled: this.telegram.enabled })
	}
}

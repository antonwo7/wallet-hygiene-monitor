import { Module } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import { NotificationsRepository } from './notifications.repository'
import { TelegramConfig } from './telegram.config'

@Module({
	providers: [NotificationsService, NotificationsRepository, TelegramConfig],
	exports: [NotificationsService]
})
export class NotificationsModule {}

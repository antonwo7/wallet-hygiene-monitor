import { Injectable, Logger } from '@nestjs/common'
import { EnvConfig } from '../../shared/config/env.config'

@Injectable()
export class TelegramConfig {
  private readonly logger = new Logger(TelegramConfig.name)

  readonly enabled: boolean
  readonly botToken?: string
  readonly webhookUrl?: string

	constructor(private readonly env: EnvConfig) {
		this.enabled = this.env.telegramEnabled
		this.webhookUrl = this.env.telegramWebhookUrl

		if (this.enabled) {
			this.botToken = this.env.telegramBotToken
		} else {
			this.botToken = this.env.telegramBotToken
      if (this.botToken) {
        this.logger.warn('TELEGRAM_BOT_TOKEN is set, but TELEGRAM_ENABLED is false. Telegram sender is disabled.')
      }
    }
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { EnvConfig } from '../config/env.config'

@Injectable()
export class MailConfig {
  private readonly logger = new Logger(MailConfig.name)

  readonly from: string
  readonly appName: string
  readonly appUrl: string

  readonly smtpHost?: string
  readonly smtpUser?: string
  readonly smtpPass?: string
  readonly smtpPort: number

	constructor(private readonly env: EnvConfig) {
		this.from = this.env.mailFrom
		this.appName = this.env.appName
		this.appUrl = this.env.appUrl ?? 'http://localhost:3000'

		this.smtpHost = this.env.smtpHost
		this.smtpUser = this.env.smtpUser
		this.smtpPass = this.env.smtpPass
		this.smtpPort = this.env.smtpPort

    if (this.smtpHost && (!this.smtpUser || !this.smtpPass)) {
      this.logger.warn('SMTP_HOST is set but SMTP_USER/SMTP_PASS are missing. Mail will fall back to dev logger.')
    }
  }

  get isSmtpEnabled(): boolean {
    return Boolean(this.smtpHost && this.smtpUser && this.smtpPass)
  }
}

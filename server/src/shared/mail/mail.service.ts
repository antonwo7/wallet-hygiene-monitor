import { Injectable, Logger } from '@nestjs/common'
import * as nodemailer from 'nodemailer'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'
import { MailConfig } from './mail.config'

@Injectable()
export class MailService {
	private readonly log = new Logger('mail')
	private transporter: nodemailer.Transporter | null = null
	private readonly from: string
	private readonly appName: string
	private readonly appUrl: string

	constructor(private readonly cfg: MailConfig) {
		this.from = this.cfg.from
		this.appName = this.cfg.appName
		this.appUrl = this.cfg.appUrl

		if (this.cfg.isSmtpEnabled && this.cfg.smtpHost && this.cfg.smtpUser && this.cfg.smtpPass) {
			this.transporter = nodemailer.createTransport({
				host: this.cfg.smtpHost,
				port: this.cfg.smtpPort,
				secure: this.cfg.smtpPort === 465,
				auth: { user: this.cfg.smtpUser, pass: this.cfg.smtpPass },
				tls: {
					rejectUnauthorized: false
				}
			})
		}
	}

	private renderTemplate(templateName: string, ctx: Record<string, unknown>) {
		const templatePath = join(process.cwd(), 'src', 'shared', 'mail', 'templates', templateName)
		const source = readFileSync(templatePath, 'utf8')
		const template = Handlebars.compile(source)
		return template({ appName: this.appName, appUrl: this.appUrl, ...ctx })
	}

	async sendRegistrationEmail(to: string, ctx: { firstName: string; lastName: string; nickname: string }) {
		const html = this.renderTemplate('registration.hbs', ctx)
		await this.send({ to, subject: `Welcome to ${this.appName}`, html })
	}

	async sendPasswordResetEmail(to: string, ctx: { resetUrl: string; expiresAt: string }) {
		const html = this.renderTemplate('reset-password.hbs', ctx)
		await this.send({ to, subject: `Password reset - ${this.appName}`, html })
	}

	async sendWalletScanEmail(
		to: string,
		ctx: {
			chain: string
			walletAddress: string
			fromBlock: number
			toBlock: number
			moreCount: number
			totalEvents: number
			events: Array<{
				kind: string
				tokenAddress: string
				spender: string
				rawValue?: string
				approved?: boolean
				txHash: string
				blockNumber: number
				txUrl: string
			}>
		}
	) {
		const html = this.renderTemplate('wallet-scan.hbs', ctx)
		await this.send({
			to,
			subject: `${this.appName}: ${ctx.events.length} approval event(s) detected`,
			html
		})
	}

	private async send(params: { to: string; subject: string; html: string }) {
		if (!this.transporter) {
			this.log.debug('smtp disabled (dev mode). email skipped', { to: params.to, subject: params.subject })
			return
		}

		try {
			await this.transporter.sendMail({
				from: this.from,
				to: params.to,
				subject: params.subject,
				html: params.html
			})
			this.log.log('email sent', { to: params.to, subject: params.subject })
		} catch (e: any) {
			this.log.error('email send failed', { to: params.to, subject: params.subject, error: e?.message })
		}
	}
}

import { Injectable } from '@nestjs/common'
import { EnvConfig } from './env.config'

@Injectable()
export class AppConfig {
	readonly port: number
	readonly corsOrigins: string[] | boolean
	readonly appUrl?: string
	readonly appName: string

	constructor(private readonly env: EnvConfig) {
		this.port = this.env.port
		this.appUrl = this.env.appUrl
		this.appName = this.env.appName

		const corsOrigins = this.env.corsOriginsRaw
		const appUrl = this.env.appUrl ?? 'http://localhost:3000'

		if (corsOrigins) {
			const items = corsOrigins
				.split(',')
				.map((s: string) => s.trim())
				.filter(Boolean)
			this.corsOrigins = items.includes('*') ? true : items
		} else if (appUrl) {
			this.corsOrigins = [appUrl]
		} else {
			this.corsOrigins = true
		}
	}
}

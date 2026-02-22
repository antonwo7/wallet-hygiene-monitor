import { Injectable } from '@nestjs/common'
import { EnvConfig } from '../../../shared/config/env.config'

export type SameSite = 'lax' | 'strict' | 'none'

@Injectable()
export class AuthCookieConfig {
	private readonly domain?: string
	private readonly secure: boolean
	private readonly sameSite: SameSite

	constructor(private readonly env: EnvConfig) {
		this.domain = this.env.cookieDomain
		this.secure = this.env.cookieSecure
		this.sameSite = this.env.cookieSameSite as SameSite
	}

	baseOptions() {
		return {
			domain: this.domain,
			secure: this.secure,
			sameSite: this.sameSite
		}
	}
}

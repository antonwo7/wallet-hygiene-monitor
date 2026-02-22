import { Injectable } from '@nestjs/common'
import { EnvConfig } from '../../../shared/config/env.config'

@Injectable()
export class AuthJwtConfig {
	constructor(private readonly env: EnvConfig) {}

	get accessSecret() {
		return this.env.jwtAccessSecret
	}
	get refreshSecret() {
		return this.env.jwtRefreshSecret
	}
	get accessExpiresIn() {
		return this.env.jwtAccessExpiresIn
	}
	get refreshExpiresIn() {
		return this.env.jwtRefreshExpiresIn
	}
}

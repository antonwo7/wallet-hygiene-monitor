import { Injectable } from '@nestjs/common'
import { RedisService } from '../../shared/redis/redis.service'
import { EnvConfig } from '../../shared/config/env.config'
import { AuthLockedError } from '../../shared/security/security.errors'
import { MetricsService } from '../../shared/telemetry/metrics.service'

function normEmail(email: string) {
	return email.trim().toLowerCase()
}

@Injectable()
export class AuthProtectionService {
	constructor(
		private readonly redis: RedisService,
		private readonly env: EnvConfig,
		private readonly metrics: MetricsService
	) {}

	private lockKey(email: string) {
		return `auth:lock:${normEmail(email)}`
	}
	private failKey(email: string) {
		return `auth:fail:${normEmail(email)}`
	}

	async assertNotLocked(email: string) {
		const key = this.lockKey(email)
		const ttl = await this.redis.raw.ttl(key)
		if (ttl > 0) {
			throw new AuthLockedError({ retryAfterSec: ttl })
		}
	}

	async onLoginFailed(email: string) {
		const failKey = this.failKey(email)
		const max = this.env.authFailMax
		const failWindow = this.env.authFailWindowSec
		const lockWindow = this.env.authLockWindowSec

		const pipe = this.redis.raw.multi()
		pipe.incr(failKey)
		pipe.ttl(failKey)
		pipe.expire(failKey, failWindow)
		const out = (await pipe.exec()) as any[]
		const count = Number(out?.[0]?.[1] ?? 0)

		if (count >= max) {
			await this.redis.raw.set(this.lockKey(email), '1', 'EX', lockWindow)
			await this.redis.raw.del(failKey)
			this.metrics.incAuthLocked()
			throw new AuthLockedError({ retryAfterSec: lockWindow })
		}
	}

	async onLoginSuccess(email: string) {
		await this.redis.raw.del(this.failKey(email))
		await this.redis.raw.del(this.lockKey(email))
	}
}

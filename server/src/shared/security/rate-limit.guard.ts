import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import { RedisService } from '../redis/redis.service'
import { RATE_LIMIT_POLICY, type RateLimitPolicy } from './rate-limit.decorator'
import { RateLimitedError } from './security.errors'
import { MetricsService } from '../telemetry/metrics.service'
import { EnvConfig } from '../config/env.config'

function clientIp(req: Request): string {
	const ip = req.ip || (req.headers['x-forwarded-for'] as string | undefined) || req.socket.remoteAddress
	return (ip ?? 'unknown').toString().split(',')[0].trim()
}

@Injectable()
export class RateLimitGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly redis: RedisService,
		private readonly metrics: MetricsService,
		private readonly env: EnvConfig
	) {}

	async canActivate(ctx: ExecutionContext): Promise<boolean> {
		const req = ctx.switchToHttp().getRequest<Request>()
		const policy = this.reflector.getAllAndOverride<RateLimitPolicy>(RATE_LIMIT_POLICY, [
			ctx.getHandler(),
			ctx.getClass()
		])
		if (!policy) return true

		let max = policy.max
		let windowSec = policy.windowSec
		if (max <= 0 || windowSec <= 0) {
			if (policy.keyPrefix === 'auth:login') {
				max = this.env.authLoginRateLimitMax
				windowSec = this.env.authLoginRateLimitWindowSec
			} else if (policy.keyPrefix === 'auth:reset') {
				max = this.env.authResetRateLimitMax
				windowSec = this.env.authResetRateLimitWindowSec
			}
		}

		const ip = clientIp(req)
		const key = `${policy.keyPrefix}:${ip}`
		const ttlKey = `${key}:ttl`

		const pipe = this.redis.raw.multi()
		pipe.incr(key)
		pipe.ttl(key)
		pipe.setnx(ttlKey, '1')
		pipe.expire(ttlKey, windowSec)
		pipe.expire(key, windowSec)
		const out = (await pipe.exec()) as any[]
		const count = Number(out?.[0]?.[1] ?? 0)
		const ttl = Number(out?.[1]?.[1] ?? windowSec)

		if (count > max) {
			this.metrics.incAuthRateLimited(policy.keyPrefix)
			throw new RateLimitedError({ retryAfterSec: Math.max(1, ttl) })
		}

		return true
	}
}

import { SetMetadata } from '@nestjs/common'

export type RateLimitPolicy = {
	keyPrefix: string
	max: number
	windowSec: number
}

export const RATE_LIMIT_POLICY = 'RATE_LIMIT_POLICY'

export const RateLimit = (policy: RateLimitPolicy) => SetMetadata(RATE_LIMIT_POLICY, policy)

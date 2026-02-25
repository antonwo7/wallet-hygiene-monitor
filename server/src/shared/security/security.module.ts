import { Global, Module } from '@nestjs/common'
import { CsrfMiddleware } from './csrf.middleware'
import { RateLimitGuard } from './rate-limit.guard'

@Global()
@Module({
	providers: [CsrfMiddleware, RateLimitGuard],
	exports: [CsrfMiddleware, RateLimitGuard]
})
export class SecurityModule {}

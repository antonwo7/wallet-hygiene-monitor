import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from '../auth.service'
import { ACCESS_COOKIE, REFRESH_COOKIE, setAuthCookies } from '../../../shared/security/cookies'
import { AuthCookieConfig } from '../config/auth-cookie.config'

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(
		private readonly auth: AuthService,
		private readonly cookies: AuthCookieConfig,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const req = context.switchToHttp().getRequest<Request>()
		const res = context.switchToHttp().getResponse<Response>()

		const access = (req.cookies?.[ACCESS_COOKIE] as string | undefined) ?? undefined
		if (!access) throw new UnauthorizedException('Unauthorized')

		try {
			const payload = this.auth.verifyAccessToken(access)
			;(req as any).user = { id: payload.sub }
			return true
		} catch (err: any) {
			const name = err?.name as string | undefined
			if (name !== 'TokenExpiredError') {
				throw new UnauthorizedException('Unauthorized')
			}

			const refresh = (req.cookies?.[REFRESH_COOKIE] as string | undefined) ?? undefined
			if (!refresh) throw new UnauthorizedException('Unauthorized')

			try {
				const payload = this.auth.verifyRefreshToken(refresh)
				const tokens = await this.auth.issueTokens(payload.sub)
				const base = this.cookies.baseOptions()
				setAuthCookies(res, tokens, { domain: base.domain, secure: base.secure, sameSite: base.sameSite as any })
				;(req as any).user = { id: payload.sub }
				return true
			} catch {
				throw new UnauthorizedException('Unauthorized')
			}
		}
	}
}

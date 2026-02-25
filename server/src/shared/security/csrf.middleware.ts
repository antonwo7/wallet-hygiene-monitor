import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { Request, Response } from 'express'
import { randomBytes } from 'crypto'
import { EnvConfig } from '../config/env.config'
import { CsrfInvalidError } from './security.errors'

export const CSRF_COOKIE = 'csrf_token'
export const CSRF_HEADER = 'x-csrf-token'

function isSafeMethod(method: string) {
	return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
}

function makeToken() {
	return randomBytes(32).toString('hex')
}

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
	constructor(private readonly env: EnvConfig) {}

	use(req: Request, res: Response, next: () => void) {
		const cookieToken = (req as any).cookies?.[CSRF_COOKIE] as string | undefined
		const token = cookieToken ?? makeToken()

		if (!cookieToken) {
			res.cookie(CSRF_COOKIE, token, {
				httpOnly: false,
				secure: Boolean(this.env.cookieSecure),
				sameSite: this.env.cookieSameSite,
				domain: this.env.cookieDomain,
				path: '/'
			})
		}

		if (!isSafeMethod(req.method)) {
			const headerToken = (req.headers[CSRF_HEADER] as string | undefined) ?? ''
			if (!headerToken || headerToken !== token) {
				throw new CsrfInvalidError()
			}
		}

		next()
	}
}

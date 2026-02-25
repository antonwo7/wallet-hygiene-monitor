import { HttpStatus } from '@nestjs/common'
import { AppError } from '../errors/app-error'

export class RateLimitedError extends AppError {
	constructor(details?: { retryAfterSec?: number }) {
		super({
			code: 'RATE_LIMITED',
			message: 'Too many requests. Please try again later.',
			httpStatus: HttpStatus.TOO_MANY_REQUESTS,
			details
		})
	}
}

export class AuthLockedError extends AppError {
	constructor(details?: { retryAfterSec?: number }) {
		super({
			code: 'AUTH_LOCKED',
			message: 'Too many failed attempts. Please try again later.',
			httpStatus: HttpStatus.TOO_MANY_REQUESTS,
			details
		})
	}
}

export class CsrfInvalidError extends AppError {
	constructor() {
		super({
			code: 'CSRF_INVALID',
			message: 'CSRF token is missing or invalid.',
			httpStatus: HttpStatus.FORBIDDEN
		})
	}
}

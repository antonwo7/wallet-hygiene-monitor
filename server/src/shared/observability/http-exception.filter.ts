import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger, type ExceptionFilter } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AppError } from '../errors/app-error'
import { RepoUniqueViolationError } from '../errors/repo-errors'
import { EmailAlreadyRegisteredError, NicknameAlreadyTakenError } from '../../domains/users/users.errors'
import { WalletAlreadyExistsError } from '../../domains/wallets/wallets.errors'

type ErrorBody = {
	error: {
		code: string
		message: string
		details?: unknown
		requestId?: string
	}
}

function requestIdFrom(req: Request): string | undefined {
	return (req as any).requestId || (req.headers['x-request-id'] as string | undefined) || undefined
}

function mapRepoToDomain(err: RepoUniqueViolationError): AppError | null {
	const meta = (err.details as any)?.meta as Record<string, unknown> | undefined
	const target = meta?.target
	if (Array.isArray(target) && target.includes('email')) return new EmailAlreadyRegisteredError()
	if (Array.isArray(target) && target.includes('nickname')) return new NicknameAlreadyTakenError()

	const op = (err.details as any)?.op as string | undefined
	if (op?.startsWith('wallet.') || op?.includes('wallet')) return new WalletAlreadyExistsError(err.details)

	return null
}

function isHttpStatus(x: unknown): x is HttpStatus {
	return typeof x === 'number' && x >= 100 && x <= 599
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
	private readonly log = new Logger('Exceptions')

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp()
		const req = ctx.getRequest<Request>()
		const res = ctx.getResponse<Response>()
		const requestId = requestIdFrom(req)

		let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
		let code = 'INTERNAL_ERROR'
		let message = 'Internal server error'
		let details: unknown = undefined

		let ex = exception
		if (ex instanceof RepoUniqueViolationError) {
			ex = mapRepoToDomain(ex) ?? ex
		}

		if (ex instanceof AppError) {
			status = isHttpStatus(ex.httpStatus) ? ex.httpStatus : HttpStatus.BAD_REQUEST
			code = ex.code
			message = ex.message
			details = ex.details
		} else if (ex instanceof HttpException) {
			status = ex.getStatus()
			const r = ex.getResponse() as any
			message = typeof r === 'string' ? r : (r?.message ?? ex.message)
			code = (r?.code as string) ?? 'HTTP_EXCEPTION'
			details = typeof r === 'object' ? r : undefined
		} else if (ex && typeof ex === 'object' && 'message' in ex) {
			message = String((ex as any).message)
		}

		const body: ErrorBody = {
			error: {
				code,
				message,
				details,
				requestId
			}
		}

		const logPayload = {
			requestId,
			method: req.method,
			path: req.originalUrl ?? req.url,
			status,
			code
		}
		if (status >= 500) this.log.error('error', ex as any, logPayload as any)
		else this.log.warn('warn', logPayload as any)

		res.status(status).json(body)
	}
}

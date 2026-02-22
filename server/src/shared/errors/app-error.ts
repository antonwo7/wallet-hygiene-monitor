export type ErrorDetails = Record<string, unknown>

export class AppError extends Error {
	readonly code: string
	readonly httpStatus?: number
	readonly details?: ErrorDetails
	readonly cause?: unknown
	readonly isOperational: boolean

	constructor(args: {
		code: string
		message: string
		httpStatus?: number
		details?: ErrorDetails
		cause?: unknown
		isOperational?: boolean
	}) {
		super(args.message)
		this.name = this.constructor.name
		this.code = args.code
		this.httpStatus = args.httpStatus
		this.details = args.details
		this.cause = args.cause
		this.isOperational = args.isOperational ?? true
	}
}

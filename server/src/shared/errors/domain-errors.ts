import { AppError } from './app-error'

export class NotFoundError extends AppError {
	constructor(message = 'Not found', details?: Record<string, unknown>) {
		super({ code: 'NOT_FOUND', message, httpStatus: 404, details })
	}
}

export class AccessDeniedError extends AppError {
	constructor(message = 'Access denied', details?: Record<string, unknown>) {
		super({ code: 'ACCESS_DENIED', message, httpStatus: 403, details })
	}
}

export class ValidationError extends AppError {
	constructor(message = 'Validation error', details?: Record<string, unknown>) {
		super({ code: 'VALIDATION_ERROR', message, httpStatus: 400, details })
	}
}

export class ConflictError extends AppError {
	constructor(code: string, message: string, details?: Record<string, unknown>) {
		super({ code, message, httpStatus: 409, details })
	}
}

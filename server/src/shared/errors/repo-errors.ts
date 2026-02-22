import { AppError } from './app-error'

export type RepoErrorCode =
	| 'DB_ERROR'
	| 'UNIQUE_VIOLATION'
	| 'NOT_FOUND'
	| 'FK_VIOLATION'
	| 'INVALID_INPUT'
	| 'TIMEOUT'

export class RepoError extends AppError {
	readonly repoCode: RepoErrorCode

	constructor(args: {
		repoCode: RepoErrorCode
		message: string
		details?: Record<string, unknown>
		cause?: unknown
	}) {
		super({
			code: `REPO_${args.repoCode}`,
			message: args.message,
			httpStatus: httpStatusFromRepoCode(args.repoCode),
			details: args.details,
			cause: args.cause,
			isOperational: true
		})
		this.repoCode = args.repoCode
	}
}

export class RepoUniqueViolationError extends RepoError {
	constructor(details?: Record<string, unknown>, cause?: unknown) {
		super({ repoCode: 'UNIQUE_VIOLATION', message: 'Unique constraint violation', details, cause })
	}
}

export class RepoNotFoundError extends RepoError {
	constructor(details?: Record<string, unknown>, cause?: unknown) {
		super({ repoCode: 'NOT_FOUND', message: 'Record not found', details, cause })
	}
}

export class RepoForeignKeyViolationError extends RepoError {
	constructor(details?: Record<string, unknown>, cause?: unknown) {
		super({ repoCode: 'FK_VIOLATION', message: 'Foreign key constraint violation', details, cause })
	}
}

export class RepoInvalidInputError extends RepoError {
	constructor(details?: Record<string, unknown>, cause?: unknown) {
		super({ repoCode: 'INVALID_INPUT', message: 'Invalid input for database operation', details, cause })
	}
}

export class RepoTimeoutError extends RepoError {
	constructor(details?: Record<string, unknown>, cause?: unknown) {
		super({ repoCode: 'TIMEOUT', message: 'Database operation timed out', details, cause })
	}
}

export class RepoDbError extends RepoError {
	constructor(details?: Record<string, unknown>, cause?: unknown) {
		super({ repoCode: 'DB_ERROR', message: 'Database error', details, cause })
	}
}

function httpStatusFromRepoCode(code: RepoErrorCode): number {
	switch (code) {
		case 'UNIQUE_VIOLATION':
			return 409
		case 'NOT_FOUND':
			return 404
		case 'FK_VIOLATION':
			return 409
		case 'INVALID_INPUT':
			return 400
		case 'TIMEOUT':
			return 503
		case 'DB_ERROR':
		default:
			return 503
	}
}

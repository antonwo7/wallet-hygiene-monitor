import { ConflictError } from '../../shared/errors/domain-errors'
import { AppError } from '../../shared/errors/app-error'

export class WalletAlreadyExistsError extends ConflictError {
	constructor(details?: Record<string, unknown>) {
		super('WALLET_ALREADY_EXISTS', 'Wallet already exists', details)
	}
}

export class WalletNotFoundError extends AppError {
	constructor(details?: Record<string, unknown>) {
		super({ code: 'WALLET_NOT_FOUND', message: 'Wallet not found', httpStatus: 404, details })
	}
}

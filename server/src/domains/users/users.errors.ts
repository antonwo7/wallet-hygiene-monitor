import { ConflictError } from '../../shared/errors/domain-errors'

export class NicknameAlreadyTakenError extends ConflictError {
	constructor(details?: Record<string, unknown>) {
		super('NICKNAME_ALREADY_TAKEN', 'Nickname is already taken', details)
	}
}

export class EmailAlreadyRegisteredError extends ConflictError {
	constructor(details?: Record<string, unknown>) {
		super('EMAIL_ALREADY_REGISTERED', 'Email is already registered', details)
	}
}

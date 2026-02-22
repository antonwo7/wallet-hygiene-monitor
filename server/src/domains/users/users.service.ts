import { Injectable, Logger } from '@nestjs/common'
import { UsersRepository } from './users.repository'
import { EmailAlreadyRegisteredError, NicknameAlreadyTakenError } from './users.errors'
import { AppError } from 'src/shared/errors/app-error'

export type CreateUserInput = {
	nickname: string
	email: string
	firstName: string
	lastName: string
	passwordHash: string
}

@Injectable()
export class UsersService {
	private readonly log = new Logger('users.service')
	constructor(private readonly repo: UsersRepository) {}

	findByEmail(email: string) {
		return this.repo.findByEmail(email)
	}

	findByNickname(nickname: string) {
		return this.repo.findByNickname(nickname)
	}

	findById(id: string) {
		return this.repo.findById(id)
	}
	async ensureUnique(nickname: string, email: string) {
		this.log.log('ensureUnique', { nickname, email })
		const [byNick, byEmail] = await Promise.all([
			this.repo.findByNickname(nickname),
			this.repo.findByEmail(email)
		])

		if (byNick) {
			this.log.warn('nickname already taken', { nickname })
			throw new NicknameAlreadyTakenError({ nickname })
		}
		if (byEmail) {
			this.log.warn('email already registered', { email })
			throw new EmailAlreadyRegisteredError({ email })
		}
	}

	async createUser(input: CreateUserInput) {
		await this.ensureUnique(input.nickname, input.email)
		return this.repo.create(input)
	}

	getUserSettings(userId: string) {
		return this.repo.getUserSettings(userId)
	}

	updateUserSettings(
		userId: string,
		data: { emailNotificationsEnabled?: boolean; emailMinRiskScore?: number }
	) {
		return this.repo.updateUserSettings(userId, data)
	}

	async getUser(userId: string) {
		this.log.log('getUserSafe', { userId })
		const user = await this.findById(userId)
		if (!user)
			throw new AppError({
				code: 'USER_NOT_FOUND',
				message: 'User not found',
				httpStatus: 404,
				details: { userId }
			})

		return {
			id: user.id,
			nickname: user.nickname,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			createdAt: user.createdAt,
			emailNotificationsEnabled: user.emailNotificationsEnabled,
			emailMinRiskScore: user.emailMinRiskScore
		}
	}
}

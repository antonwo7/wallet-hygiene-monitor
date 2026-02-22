import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { nanoid } from 'nanoid'
import { MailService } from '../../shared/mail/mail.service'
import { AppConfig } from '../../shared/config/app.config'
import { hashPassword, verifyPassword } from '../../shared/security/password'
import { ValidationError } from '../../shared/errors/domain-errors'
import { AuthJwtConfig } from './config/auth-jwt.config'
import { AppError } from 'src/shared/errors/app-error'
import { UsersService } from '../users/users.service'
import { AuthRepository } from './auth.repository'

export type JwtPayload = { sub: string }

@Injectable()
export class AuthService {
	private readonly log = new Logger('auth.service')

	constructor(
		private readonly users: UsersService,
		private readonly repo: AuthRepository,
		private readonly jwt: JwtService,
		private readonly jwtConfig: AuthJwtConfig,
		private readonly appConfig: AppConfig,
		private readonly mail: MailService
	) {}

	async issueTokens(userId: string) {
		const payload: JwtPayload = { sub: userId }

		const [accessToken, refreshToken] = await Promise.all([
			this.jwt.signAsync(payload, {
				secret: this.jwtConfig.accessSecret,
				expiresIn: this.jwtConfig.accessExpiresIn
			}),
			this.jwt.signAsync(payload, {
				secret: this.jwtConfig.refreshSecret,
				expiresIn: this.jwtConfig.refreshExpiresIn
			})
		])

		return { accessToken, refreshToken }
	}

	async register(dto: {
		nickname: string
		email: string
		firstName: string
		lastName: string
		password: string
	}) {
		this.log.log('register', { email: dto.email, nickname: dto.nickname })

		const passwordHash = await hashPassword(dto.password)

		const user = await this.users.createUser({
			nickname: dto.nickname,
			email: dto.email,
			firstName: dto.firstName,
			lastName: dto.lastName,
			passwordHash
		})

		await this.mail.sendRegistrationEmail(user.email, {
			firstName: user.firstName,
			lastName: user.lastName,
			nickname: user.nickname
		})

		const tokens = await this.issueTokens(user.id)
		return { user, tokens }
	}

	async login(dto: { identifier: string; password: string }) {
		this.log.log('login', { identifier: dto.identifier })
		const identifier = dto.identifier.trim()
		const isEmail = identifier.includes('@')

		const user = isEmail
			? await this.users.findByEmail(identifier)
			: await this.users.findByNickname(identifier)

		if (!user) throw new UnauthorizedException('Invalid credentials')

		const ok = await verifyPassword(user.passwordHash, dto.password)
		if (!ok) throw new UnauthorizedException('Invalid credentials')

		const tokens = await this.issueTokens(user.id)
		return { user, tokens }
	}

	async getUserSafe(userId: string) {
		return await this.users.getUser(userId)
	}

	async requestPasswordReset(email: string) {
		this.log.log('requestPasswordReset', { email })
		const user = await this.users.findByEmail(email)
		if (!user) return

		const rawToken = nanoid(48)
		const tokenHash = await hashPassword(rawToken)
		const expiresAt = new Date(Date.now() + 1000 * 60 * 30)

		await this.repo.createPasswordResetToken({
			userId: user.id,
			tokenHash,
			expiresAt
		})

		const baseUrl = this.appConfig.appUrl
		const resetUrl = `${baseUrl}/reset-password/${rawToken}`

		await this.mail.sendPasswordResetEmail(user.email, {
			resetUrl,
			expiresAt: expiresAt.toISOString()
		})
	}

	async resetPassword(rawToken: string, password: string, passwordConfirm: string) {
		this.log.log('resetPassword')
		if (password !== passwordConfirm) throw new ValidationError('Passwords do not match')

		const candidates = await this.repo.findActivePasswordResetCandidates(50)

		let matched: (typeof candidates)[number] | null = null
		for (const c of candidates) {
			const ok = await verifyPassword(c.tokenHash, rawToken)
			if (ok) {
				matched = c
				break
			}
		}

		if (!matched) throw new ValidationError('Invalid or expired token')

		const newHash = await hashPassword(password)

		await this.repo.resetPasswordTransaction({
			userId: matched.userId,
			newPasswordHash: newHash,
			tokenId: matched.id
		})
	}

	verifyAccessToken(token: string) {
		return this.jwt.verify<JwtPayload>(token, { secret: this.jwtConfig.accessSecret })
	}

	verifyRefreshToken(token: string) {
		return this.jwt.verify<JwtPayload>(token, { secret: this.jwtConfig.refreshSecret })
	}
}

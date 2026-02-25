import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { UsersModule } from '../users/users.module'
import { AuthGuard } from './guards/auth.guard'
import { MailModule } from 'src/shared/mail/mail.module'
import { AuthCookieConfig } from './config/auth-cookie.config'
import { AuthJwtConfig } from './config/auth-jwt.config'
import { AuthRepository } from './auth.repository'
import { AuthProtectionService } from './auth-protection.service'
import { AuthAttemptsService } from './auth-attempts.service'

@Module({
	imports: [UsersModule, JwtModule.register({}), MailModule],
	controllers: [AuthController],
	providers: [
		AuthService,
		AuthRepository,
		AuthGuard,
		AuthCookieConfig,
		AuthJwtConfig,
		AuthProtectionService,
		AuthAttemptsService
	],
	exports: [AuthService, AuthGuard, AuthCookieConfig, AuthJwtConfig]
})
export class AuthModule {}

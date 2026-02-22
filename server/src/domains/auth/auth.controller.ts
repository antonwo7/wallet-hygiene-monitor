import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { RequestResetDto } from './dto/request-reset.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { AuthGuard } from './guards/auth.guard'
import { clearAuthCookies, setAuthCookies } from '../../shared/security/cookies'
import { AuthCookieConfig } from './config/auth-cookie.config'

@Controller('auth')
export class AuthController {
	constructor(
		private readonly auth: AuthService,
		private readonly cookies: AuthCookieConfig
	) {}

	@Post('register')
	async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
		const { user, tokens } = await this.auth.register(dto)
		const base = this.cookies.baseOptions()
		setAuthCookies(res, tokens, { domain: base.domain, secure: base.secure, sameSite: base.sameSite as any })
		return { user: await this.auth.getUserSafe(user.id) }
	}

	@Post('login')
	async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
		const { user, tokens } = await this.auth.login(dto)
		const base = this.cookies.baseOptions()
		setAuthCookies(res, tokens, { domain: base.domain, secure: base.secure, sameSite: base.sameSite as any })
		return { user: await this.auth.getUserSafe(user.id) }
	}

	@Post('logout')
	async logout(@Res({ passthrough: true }) res: Response) {
		const base = this.cookies.baseOptions()
		clearAuthCookies(res, { domain: base.domain, secure: base.secure, sameSite: base.sameSite as any })
		return { ok: true }
	}

	@UseGuards(AuthGuard)
	@Get('me')
	async me(@Req() req: Request) {
		const userId = (req as any).user?.id as string
		return { user: await this.auth.getUserSafe(userId) }
	}

	@Post('password/request')
	async requestReset(@Body() dto: RequestResetDto) {
		await this.auth.requestPasswordReset(dto.email)
		return { ok: true }
	}

	@Post('password/reset')
	async reset(@Body() dto: ResetPasswordDto) {
		await this.auth.resetPassword(dto.token, dto.password, dto.passwordConfirm)
		return { ok: true }
	}
}

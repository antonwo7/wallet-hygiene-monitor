import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { UsersService } from './users.service'
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto'
import { AuthGuard } from '../auth/guards/auth.guard'

@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@UseGuards(AuthGuard)
	@Get('settings')
	async meSettings(@Req() req: Request) {
		const userId = (req as any).user?.id as string
		return { settings: await this.usersService.getUserSettings(userId) }
	}

	@UseGuards(AuthGuard)
	@Patch('settings')
	async updateMeSettings(@Req() req: Request, @Body() dto: UpdateUserSettingsDto) {
		const userId = (req as any).user?.id as string
		const settings = await this.usersService.updateUserSettings(userId, dto)
		return { settings }
	}
}

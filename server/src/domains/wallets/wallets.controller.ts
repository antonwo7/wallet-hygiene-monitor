import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import { AuthGuard } from '../auth/guards/auth.guard'
import { CreateWalletDto } from './dto/create-wallet.dto'
import { WalletsService } from './services/wallets.service'

@UseGuards(AuthGuard)
@Controller('wallets')
export class WalletsController {
	constructor(private readonly wallets: WalletsService) {}

	@Get()
	list(@Req() req: Request) {
		const userId = (req as any).user?.id as string
		return this.wallets.list(userId)
	}

	@Post()
	add(@Req() req: Request, @Body() dto: CreateWalletDto) {
		const userId = (req as any).user?.id as string
		return this.wallets.add(userId, dto)
	}

	@Patch(':id/disable')
	disable(@Req() req: Request, @Param('id') id: string) {
		const userId = (req as any).user?.id as string
		return this.wallets.disable(userId, id)
	}

	@Patch(':id/enable')
	enable(@Req() req: Request, @Param('id') id: string) {
		const userId = (req as any).user?.id as string
		return this.wallets.enable(userId, id)
	}
}

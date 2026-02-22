import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseEnumPipe,
	Post,
	Query,
	Req,
	UseGuards
} from '@nestjs/common'
import type { Request } from 'express'
import { Chain } from '@prisma/client'
import { AuthGuard } from '../auth/guards/auth.guard'
import { AllowlistService } from './allowlist.service'
import { AddTrustedSpenderDto } from './dto/add-trusted-spender.dto'

@UseGuards(AuthGuard)
@Controller('allowlist')
export class AllowlistController {
	constructor(private readonly allowlist: AllowlistService) {}

	@Get()
	async list(@Req() req: Request, @Query('chain') chain?: Chain) {
		const userId = (req as any).user?.id as string
		return this.allowlist.list(userId, chain)
	}

	@Post()
	async add(@Req() req: Request, @Body() dto: AddTrustedSpenderDto) {
		const userId = (req as any).user?.id as string
		return this.allowlist.add(userId, dto)
	}

	@Delete(':chain/:spender')
	async remove(
		@Req() req: Request,
		@Param('chain', new ParseEnumPipe(Chain)) chain: Chain,
		@Param('spender') spender: string
	) {
		const userId = (req as any).user?.id as string
		return this.allowlist.remove(userId, { chain, spender })
	}
}

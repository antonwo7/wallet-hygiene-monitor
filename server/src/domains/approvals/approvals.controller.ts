import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common'
import type { Request } from 'express'
import type { ApprovalKind, Chain } from '@prisma/client'
import { AuthGuard } from '../auth/guards/auth.guard'
import { ApprovalsService } from './approvals.service'

@UseGuards(AuthGuard)
@Controller('approvals')
export class ApprovalsController {
	constructor(private readonly approvals: ApprovalsService) {}

	@Get()
	feed(
		@Req() req: Request,
		@Query('chain') chain?: Chain,
		@Query('kind') kind?: ApprovalKind,
		@Query('minRisk') minRisk?: string,
		@Query('skip') skip?: string,
		@Query('take') take?: string
	) {
		const userId = (req as any).user?.id as string

		return this.approvals.feed({
			userId,
			chain,
			kind,
			minRiskScore: typeof minRisk === 'string' ? Number(minRisk) : undefined,
			skip: typeof skip === 'string' ? Number(skip) : undefined,
			take: typeof take === 'string' ? Number(take) : undefined
		})
	}
}

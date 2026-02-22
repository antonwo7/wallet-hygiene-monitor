import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import type { ApprovalKind, Chain, Prisma, ApprovalEvent } from '@prisma/client'

@Injectable()
export class ApprovalsRepository {
	private readonly log = new Logger('approvals.repo')
	constructor(private readonly prisma: PrismaService) {}

	async createManyAndFind(events: Prisma.ApprovalEventCreateManyInput[], skipDuplicates: boolean = true) {
		await this.prisma.client.approvalEvent.createMany({
			data: events,
			skipDuplicates
		})

		const created = await this.findAny(
			events.map(e => ({ chain: e.chain, txHash: e.txHash, logIndex: e.logIndex }))
		)

		return created
	}

	async createOne(event: Prisma.ApprovalEventCreateInput) {
		return this.prisma.client.approvalEvent.create({ data: event })
	}

	findFeed(params: {
		userId: string
		chain?: Chain
		kind?: ApprovalKind
		minRiskScore?: number
		take: number
		skip: number
	}) {
		const { userId, chain, kind, minRiskScore, take, skip } = params
		this.log.debug('db.approvalEvent.findFeed', { userId, chain, kind, minRiskScore, take, skip })
		return this.prisma.client.approvalEvent.findMany({
			where: {
				wallet: { userId },
				...(chain ? { chain } : {}),
				...(kind ? { kind } : {}),
				...(typeof minRiskScore === 'number' ? { riskScore: { gte: minRiskScore } } : {})
			},
			orderBy: [{ blockNumber: 'desc' }, { logIndex: 'desc' }],
			skip,
			take,
			include: {
				wallet: { select: { id: true, chain: true, address: true } }
			}
		})
	}

	async find(
		where: Prisma.ApprovalEventWhereInput,
		opts?: {
			take?: number
			skip?: number
			cursor?: Prisma.ApprovalEventWhereUniqueInput
			orderBy?: Prisma.ApprovalEventOrderByWithRelationInput | Prisma.ApprovalEventOrderByWithRelationInput[]
			select?: Prisma.ApprovalEventSelect
			include?: Prisma.ApprovalEventInclude
		}
	) {
		return this.prisma.client.approvalEvent.findMany({
			where,
			take: opts?.take,
			skip: opts?.skip,
			cursor: opts?.cursor,
			orderBy: opts?.orderBy,
			...(opts?.select ? { select: opts.select } : {}),
			...(opts?.include ? { include: opts.include } : {})
		})
	}

	async findAny(where: Prisma.ApprovalEventWhereInput[]): Promise<ApprovalEvent[]> {
		if (where.length === 0) return []

		return this.prisma.client.approvalEvent.findMany({
			where: {
				OR: where
			}
		})
	}
}

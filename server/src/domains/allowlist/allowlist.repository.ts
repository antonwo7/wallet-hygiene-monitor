import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { Chain } from '@prisma/client'

@Injectable()
export class AllowlistRepository {
	private readonly log = new Logger('allowlist.repo')
	constructor(private readonly prisma: PrismaService) {}

	async findTrusted(userId: string, chain: Chain, spenders: string[]): Promise<Set<string>> {
		if (spenders.length === 0) return new Set()

		this.log.debug('db.trustedSpender.findMany', { userId, chain, spenders: spenders.length })

		const rows = await this.prisma.client.trustedSpender.findMany({
			where: {
				userId,
				chain,
				spender: { in: spenders }
			},
			select: { spender: true }
		})

		return new Set(rows.map(r => r.spender))
	}

	async list(userId: string, chain?: Chain) {
		this.log.debug('db.trustedSpender.list', { userId, chain })

		return this.prisma.client.trustedSpender.findMany({
			where: {
				userId,
				...(chain ? { chain } : {})
			},
			orderBy: { createdAt: 'desc' }
		})
	}

	async upsertOne(params: { userId: string; chain: Chain; spender: string; label?: string }) {
		const { userId, chain, spender, label } = params

		this.log.debug('db.trustedSpender.upsert', { userId, chain, spender })

		return this.prisma.client.trustedSpender.upsert({
			where: {
				userId_chain_spender: { userId, chain, spender }
			},
			create: { userId, chain, spender, label: label ?? null },
			update: { label: label ?? null }
		})
	}

	async deleteOne(params: { userId: string; chain: Chain; spender: string }) {
		const { userId, chain, spender } = params

		this.log.debug('db.trustedSpender.deleteMany', { userId, chain, spender })

		const res = await this.prisma.client.trustedSpender.deleteMany({
			where: { userId, chain, spender }
		})

		return res.count
	}
}

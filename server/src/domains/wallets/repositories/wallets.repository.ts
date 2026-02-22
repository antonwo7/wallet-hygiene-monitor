import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../shared/prisma/prisma.service'
import { BackfillStatus, type Chain, type WalletStatus } from '@prisma/client'

@Injectable()
export class WalletsRepository {
	private readonly log = new Logger('wallets.repo')
	constructor(private readonly prisma: PrismaService) {}

	findManyByUser(userId: string) {
		this.log.debug('db.wallet.findManyByUser', { userId })
		return this.prisma.client.wallet.findMany({
			where: { userId },
			orderBy: { createdAt: 'desc' },
			include: { state: true }
		})
	}

	findByIdForUser(id: string, userId: string) {
		this.log.debug('db.wallet.findByIdForUser', { id, userId })
		return this.prisma.client.wallet.findFirst({ where: { id, userId }, include: { state: true } })
	}

	createWithState(data: { userId: string; chain: Chain; address: string }) {
		this.log.debug('db.wallet.createWithState', data)

		return this.prisma.client.wallet.create({
			data: {
				userId: data.userId,
				chain: data.chain,
				address: data.address,
				state: {
					create: {
						lastScannedBlock: 0n,
						backfillStatus: BackfillStatus.pending,
						backfillStartedAt: null,
						backfillFinishedAt: null,
						backfillError: null
					}
				}
			},
			include: { state: true }
		})
	}

	setStatus(id: string, userId: string, status: WalletStatus) {
		this.log.debug('db.wallet.setStatus', { id, userId, status })
		return this.prisma.client.wallet.updateMany({ where: { id, userId }, data: { status } })
	}

	async getUserIdsByWalletIds(walletIds: string[]): Promise<Map<string, string>> {
		this.log.debug('db.wallet.getUserIdsByWalletIds', { walletIds: walletIds.length })
		const rows = await this.prisma.client.wallet.findMany({
			where: { id: { in: walletIds } },
			select: { id: true, userId: true }
		})
		return new Map(rows.map(r => [r.id, r.userId]))
	}
}

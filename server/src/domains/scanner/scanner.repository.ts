import { Injectable, Logger } from '@nestjs/common'
import { WalletStatus } from '@prisma/client'
import { PrismaService } from '../../shared/prisma/prisma.service'

@Injectable()
export class ScannerRepository {
	private readonly log = new Logger('scanner.repo')
	constructor(private readonly prisma: PrismaService) {}

	getActiveWallets() {
		this.log.debug('db.wallet.getActiveWallets')
		return this.prisma.client.wallet.findMany({
			where: { status: WalletStatus.ACTIVE },
			include: {
				state: true,
				user: {
					select: {
						id: true,
						email: true,
						emailNotificationsEnabled: true,
						emailMinRiskScore: true
					}
				}
			},
			orderBy: { createdAt: 'asc' }
		})
	}

	updateLastScannedBlock(walletId: string, lastScannedBlock: bigint) {
		this.log.debug('db.walletState.updateLastScannedBlock', {
			walletId,
			lastScannedBlock: lastScannedBlock.toString()
		})
		return this.prisma.client.walletState.update({
			where: { walletId },
			data: { lastScannedBlock }
		})
	}
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../shared/prisma/prisma.service'

@Injectable()
export class WalletStateRepository {
	constructor(private readonly prisma: PrismaService) {}

	async updateByWalletId(walletId: string, data: Prisma.WalletStateUpdateInput) {
		if (Object.keys(data).length === 0) {
			const existing = await this.prisma.client.walletState.findUnique({ where: { walletId } })
			if (!existing) throw new NotFoundException('WalletState not found')
			return existing
		}

		try {
			return await this.prisma.client.walletState.update({
				where: { walletId },
				data: data
			})
		} catch (e: any) {
			if (e?.code === 'P2025') throw new NotFoundException('WalletState not found')
			throw e
		}
	}
}

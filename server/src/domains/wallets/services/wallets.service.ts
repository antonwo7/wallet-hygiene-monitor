import { Injectable, Logger } from '@nestjs/common'
import { WalletStatus, Chain } from '@prisma/client'
import { ethers } from 'ethers'
import { WalletsRepository } from '../repositories/wallets.repository'
import { WalletStateRepository } from '../repositories/wallet-state.repository'
import { CreateWalletDto } from '../dto/create-wallet.dto'
import { WalletNotFoundError } from '../wallets.errors'
import { EnvConfig } from '../../../shared/config/env.config'

@Injectable()
export class WalletsService {
	private readonly log = new Logger('wallets.service')
	private readonly providers: Partial<Record<Chain, ethers.JsonRpcProvider>> = {}

	constructor(
		private readonly walletsRepository: WalletsRepository,
		private readonly walletStateRepository: WalletStateRepository,
		private readonly env: EnvConfig
	) {}

	private getProvider(chain: Chain) {
		const cached = this.providers[chain]
		if (cached) return cached
		const url = this.env.rpcUrl(chain)
		const p = new ethers.JsonRpcProvider(url)
		this.providers[chain] = p
		return p
	}

	list(userId: string) {
		this.log.log('list wallets', { userId })
		return this.walletsRepository.findManyByUser(userId)
	}

	async add(userId: string, dto: CreateWalletDto) {
		const address = dto.address.toLowerCase()
		const chain = dto.chain as any as Chain

		this.log.log('add wallet', { userId, chain, address })
		const wallet = await this.walletsRepository.createWithState({ userId, chain, address })

		const provider = this.getProvider(chain)
		const latestBlock = await provider.getBlockNumber()
		const confirmations = this.env.scannerConfirmations(chain)
		const safeLatest = Math.max(0, latestBlock - confirmations)

		const days = this.env.backfillDays(chain)
		const avg = this.env.avgBlockTimeSeconds(chain)
		const blocksBack = Math.floor((days * 86400) / Math.max(1, avg))
		const startBlock = Math.max(0, safeLatest - blocksBack)

		await this.walletStateRepository.updateByWalletId(wallet.id, {
			lastScannedBlock: BigInt(startBlock),
			backfillStartedAt: null,
			backfillFinishedAt: null,
			backfillError: null
		})

		this.log.log('wallet backfill start configured', {
			walletId: wallet.id,
			chain,
			address,
			latestBlock,
			safeLatest,
			days,
			avg,
			blocksBack,
			startBlock
		})

		return wallet
	}

	async disable(userId: string, walletId: string) {
		this.log.log('disable wallet', { userId, walletId })
		const wallet = await this.walletsRepository.findByIdForUser(walletId, userId)
		if (!wallet) throw new WalletNotFoundError({ walletId })

		await this.walletsRepository.setStatus(walletId, userId, WalletStatus.DISABLED)
		return { ok: true }
	}

	async enable(userId: string, walletId: string) {
		this.log.log('enable wallet', { userId, walletId })
		const wallet = await this.walletsRepository.findByIdForUser(walletId, userId)
		if (!wallet) throw new WalletNotFoundError({ walletId })

		await this.walletsRepository.setStatus(walletId, userId, WalletStatus.ACTIVE)
		return { ok: true }
	}
}

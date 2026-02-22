import { Injectable, Logger } from '@nestjs/common'
import { ethers, zeroPadValue } from 'ethers'
import { ApprovalEvent, ApprovalKind, BackfillStatus, Chain } from '@prisma/client'
import { ScannerRepository } from './scanner.repository'
import { EnvConfig } from '../../shared/config/env.config'
import { sleep } from '../../shared/helpers/sleep.helper'
import { ApprovalsService } from '../approvals/approvals.service'
import { CreateApprovalEventDto } from '../wallets/dto/create-approval-event.dto'
import {
	APPROVAL_FOR_ALL_TOPIC,
	APPROVAL_TOPIC,
	getLogIndex,
	getLogs,
	parseLog
} from 'src/shared/evm/approvals.events'
import { MailService } from '../../shared/mail/mail.service'

type WalletWithState = Awaited<ReturnType<ScannerRepository['getActiveWallets']>>[number]
type EventForEmail = {
	kind: string
	tokenAddress: string
	spender: string
	rawValue?: string
	approved?: boolean
	riskScore: number
	riskLevel: string
	reasons: string[]
	txHash: string
	blockNumber: number
	txUrl: string
}

const logNames: Record<string, ApprovalKind> = {
	['Approval']: ApprovalKind.ERC20_APPROVAL,
	['ApprovalForAll']: ApprovalKind.APPROVAL_FOR_ALL
}

@Injectable()
export class ScannerService {
	private readonly log = new Logger('scanner.service')
	private readonly providers: Partial<Record<Chain, ethers.JsonRpcProvider>> = {}

	constructor(
		private readonly repo: ScannerRepository,
		private readonly env: EnvConfig,
		private readonly approvals: ApprovalsService,
		private readonly mail: MailService
	) {}

	private getProvider(chain: Chain) {
		const cached = this.providers[chain]
		if (cached) return cached

		const url = this.env.rpcUrl(chain)
		const p = new ethers.JsonRpcProvider(url)
		this.providers[chain] = p
		return p
	}

	async scanTick(): Promise<void> {
		const wallets = await this.repo.getActiveWallets()
		if (wallets.length === 0) {
			this.log.debug('scanTick: no active wallets')
			return
		}

		const byChain = new Map<Chain, WalletWithState[]>()
		for (const w of wallets) {
			const arr = byChain.get(w.chain)
			if (arr) arr.push(w)
			else byChain.set(w.chain, [w])
		}

		for (const [chain, chainWallets] of byChain.entries()) {
			await this.scanChain(chain, chainWallets)
		}
	}

	private async scanChain(chain: Chain, wallets: WalletWithState[]) {
		const provider = this.getProvider(chain)
		const latestBlockNumber = await provider.getBlockNumber()
		const confirmations = this.env.scannerConfirmations(chain)
		const safeLatestBlockNumber = Math.max(0, latestBlockNumber - confirmations)
		const limit = this.env.eventsPerEmailLimit

		this.log.log('scanChain', {
			chain,
			wallets: wallets.length,
			latestBlockNumber,
			safeLatestBlockNumber
		})

		if (safeLatestBlockNumber <= 0) return

		for (const w of wallets) {
			if (!w.state) {
				this.log.warn('wallet has no state, skipping', { walletId: w.id, chain, address: w.address })
				continue
			}
			if (w.state?.backfillStatus !== BackfillStatus.pending) continue
			if (!w.user?.email) {
				this.log.warn('wallet user has no email, skipping notifications', {
					walletId: w.id,
					userId: w.user?.id
				})
			}

			const last = Number(w.state.lastScannedBlock ?? 0n)
			if (safeLatestBlockNumber <= last) continue

			const from = last + 1
			const to = safeLatestBlockNumber

			const eventsForEmail = await this.scanWalletRange({
				chain,
				walletId: w.id,
				address: w.address,
				fromBlock: from,
				toBlock: to
			})

			const emailEnabled = !!w.user?.email && w.user?.emailNotificationsEnabled
			const minRisk = Number(w.user?.emailMinRiskScore ?? 1)

			const filteredForEmail = eventsForEmail.filter(e => e.riskScore >= minRisk)

			if (emailEnabled && filteredForEmail.length > 0) {
				const total = filteredForEmail.length
				const sliced = filteredForEmail.slice(0, Math.max(1, limit))
				const moreCount = Math.max(0, total - sliced.length)

				await this.mail.sendWalletScanEmail(w.user.email, {
					chain: chain,
					walletAddress: w.address,
					fromBlock: from,
					toBlock: to,
					moreCount,
					events: sliced,
					totalEvents: total
				})
			}
		}
	}

	private async scanWalletRange(params: {
		walletId: string
		chain: Chain
		address: string
		fromBlock: number
		toBlock: number
	}): Promise<EventForEmail[]> {
		const { walletId, chain, address, fromBlock, toBlock } = params

		const provider = this.getProvider(chain)
		const delayMs = this.env.getRateLimitDelayMs(chain)
		const batchSizeBlocks = this.env.getBatchSizeBlocks(chain)

		this.log.debug('scanWalletRange', { walletId, chain, address, fromBlock, toBlock })

		const ownerTopic = zeroPadValue(address, 32)

		const allEvents: ApprovalEvent[] = []

		for (let from = fromBlock; from <= toBlock; from += batchSizeBlocks) {
			const to = Math.min(from + batchSizeBlocks - 1, toBlock)
			const filter = {
				fromBlock: from,
				toBlock: to,
				topics: [[APPROVAL_TOPIC, APPROVAL_FOR_ALL_TOPIC], ownerTopic]
			}

			let logs = await getLogs(provider, filter)
			if (logs === null) {
				this.log.error('provider.getLogs failed (skipping wallet for this tick)', {
					chain,
					filter
				})
				break
			}

			const rows: CreateApprovalEventDto[] = []

			for (const log of logs) {
				let parsed = parseLog(log)
				if (!parsed) {
					this.log.error('Log parsing failed', log)
					continue
				}

				const owner = String(parsed.args.owner).toLowerCase()
				if (owner !== address.toLowerCase()) continue

				const logIndex = getLogIndex(log)

				const parsedLogName = logNames[parsed.name]
				if (!parsedLogName) {
					this.log.error('Logs with this name are not monitored', {
						chain,
						walletId,
						parsedLogName
					})
					continue
				}

				const approve = {
					walletId,
					chain,
					kind: parsedLogName,
					tokenAddress: log.address.toLowerCase(),
					spender: parsed.args.spender
						? String(parsed.args.spender).toLowerCase()
						: parsed.args.operator
							? String(parsed.args.operator).toLowerCase()
							: '',
					rawValue: parsed.args.value !== undefined ? parsed.args.value.toString() : undefined,
					approved: parsed.args.approved !== undefined ? Boolean(parsed.args.approved) : undefined,
					txHash: log.transactionHash,
					blockNumber: String(log.blockNumber),
					logIndex
				}

				rows.push(approve)
			}

			const createdApprovalsEvents = await this.approvals.createMany(rows)

			allEvents.push(...createdApprovalsEvents)

			await this.repo.updateLastScannedBlock(walletId, BigInt(to))

			this.log.debug('wallet chunk done', {
				chain,
				walletId,
				from,
				to,
				logs: logs.length,
				rows: rows.length,
				createdCount: allEvents.length
			})

			await sleep(delayMs)
		}

		return allEvents
			.filter(e => e.riskScore > 0)
			.map(r => ({
				kind: r.kind,
				tokenAddress: r.tokenAddress,
				spender: r.spender,
				rawValue: r.rawValue ?? undefined,
				approved: r.approved ?? undefined,
				riskScore: r.riskScore,
				riskLevel: r.riskLevel,
				reasons: Array.isArray((r.riskMeta as any)?.reasons) ? ((r.riskMeta as any).reasons as string[]) : [],
				txHash: r.txHash,
				blockNumber: Number(r.blockNumber),
				txUrl: this.env.txExplorerUrl(r.chain, r.txHash)
			}))
	}
}

import { Injectable, Logger } from '@nestjs/common'
import { ApprovalEvent, ApprovalKind, Chain, Prisma, RiskLevel } from '@prisma/client'
import { ApprovalKind as ApprovalKindEnum } from '@prisma/client'
import { ApprovalsRepository } from './approvals.repository'
import { CreateApprovalEventDto } from '../wallets/dto/create-approval-event.dto'
import { scoreToRiskLevel } from '../risk/risk.config'
import { stringBigInt } from 'src/shared/helpers/convert'
import { EnvConfig } from 'src/shared/config/env.config'
import { WalletsRepository } from '../wallets/repositories/wallets.repository'
import { AllowlistService } from '../allowlist/allowlist.service'

type RiskResult = {
	riskScore: number
	riskLevel: RiskLevel
	riskMeta: Record<string, any>
}

@Injectable()
export class ApprovalsService {
	private readonly log = new Logger('approvals.service')
	constructor(
		private readonly repo: ApprovalsRepository,
		private readonly env: EnvConfig,
		private readonly walletsRepo: WalletsRepository,
		private readonly allowlist: AllowlistService
	) {
		this.valuableTokensByChain = this.buildValuableTokensByChain()
	}

	private static readonly MAX_UINT256 = (1n << 256n) - 1n
	private static readonly HUGE_ALLOWANCE_THRESHOLD = 1n << 255n
	private valuableTokensByChain: Partial<Record<Chain, Set<string>>> = {}

	private buildValuableTokensByChain(): Partial<Record<Chain, Set<string>>> {
		const parse = (raw?: string) =>
			new Set(
				(raw ?? '')
					.split(',')
					.map(x => x.trim().toLowerCase())
					.filter(Boolean)
			)

		return {
			[Chain.ethereum]: parse(this.env.valuableTokensEthereum),
			[Chain.polygon]: parse(this.env.valuableTokensPolygon),
			[Chain.arbitrum]: parse(this.env.valuableTokensArbitrum)
		}
	}

	feed(params: {
		userId: string
		chain?: Chain
		kind?: ApprovalKind
		minRiskScore?: number
		skip?: number
		take?: number
	}) {
		const data = {
			userId: params.userId,
			chain: params.chain,
			kind: params.kind,
			minRiskScore: params.minRiskScore,
			skip: params.skip ?? 0,
			take: Math.min(Math.max(params.take ?? 50, 1), 200)
		}
		this.log.log('feed', data)
		return this.repo.findFeed(data)
	}

	createOne(event: Prisma.ApprovalEventCreateInput) {
		this.log.log('createOne', {
			chain: event.chain,
			txHash: event.txHash,
			logIndex: event.logIndex
		})
		return this.repo.createOne({
			...event,
			blockNumber: BigInt(event.blockNumber)
		})
	}

	async createMany(events: CreateApprovalEventDto[]): Promise<ApprovalEvent[]> {
		if (events.length === 0) return []

		const existingEvents = await this.repo.findAny(
			events.map(r => ({ chain: r.chain, txHash: r.txHash, logIndex: r.logIndex }))
		)
		const existingKeys = new Set(existingEvents.map(e => `${e.chain}:${e.txHash}:${e.logIndex}`))
		const newEvents = events.filter(e => !existingKeys.has(`${e.chain}:${e.txHash}:${e.logIndex}`))
		if (newEvents.length === 0) return []

		const walletIds = Array.from(new Set(newEvents.map(e => e.walletId)))
		const walletIdToUserId = await this.walletsRepo.getUserIdsByWalletIds(walletIds)

		const groupToSpenders = new Map<string, Set<string>>()
		for (const e of newEvents) {
			const userId = walletIdToUserId.get(e.walletId)
			if (!userId) continue

			const k = `${userId}:${e.chain}`
			let set = groupToSpenders.get(k)
			if (!set) {
				set = new Set<string>()
				groupToSpenders.set(k, set)
			}

			set.add(String(e.spender).toLowerCase())
		}

		const groupToTrusted = new Map<string, Set<string>>()
		for (const [k, spendersSet] of groupToSpenders.entries()) {
			const [userId, chain] = k.split(':') as [string, Chain]
			const trusted = await this.allowlist.getTrustedSet(userId, chain, Array.from(spendersSet))
			groupToTrusted.set(k, trusted)
		}

		const toCreate: Prisma.ApprovalEventCreateManyInput[] = newEvents.map(e => {
			const userId = walletIdToUserId.get(e.walletId)
			const trustedSet = userId ? groupToTrusted.get(`${userId}:${e.chain}` as const) : undefined
			const isTrustedSpender = trustedSet
				? trustedSet.has(String(e.spender).toLowerCase())
				: userId
					? false
					: undefined
			return {
				...e,
				blockNumber: BigInt(e.blockNumber),
				...this.computeRisk(e, { isTrustedSpender })
			}
		})

		return this.repo.createManyAndFind(toCreate)
	}

	private computeRisk(dto: CreateApprovalEventDto, ctx?: { isTrustedSpender?: boolean }): RiskResult {
		const details = { rawValue: dto.rawValue ?? null, approved: dto.approved ?? null }

		const revokeResult = {
			riskScore: 0,
			riskLevel: scoreToRiskLevel(0),
			riskMeta: {
				reasons: ['REVOKE'],
				isInfinite: false,
				details
			}
		}

		const reasons: string[] = []

		const token = String(dto.tokenAddress).toLowerCase()
		const chain = dto.chain
		const isValuable = this.valuableTokensByChain[chain]?.has(token) ?? false

		let score = isValuable ? 20 : 0
		if (isValuable) reasons.push('VALUABLE_TOKEN')

		if (ctx?.isTrustedSpender === false) {
			score += 25
			reasons.push('SPENDER_NOT_ALLOWLISTED')
		}

		// ERC-20 Approval
		if (dto.kind === ApprovalKindEnum.ERC20_APPROVAL) {
			const v = stringBigInt(dto.rawValue)

			if (v === 0n) return revokeResult

			let isInfinite = false
			if (v != null) {
				if (v === ApprovalsService.MAX_UINT256) {
					isInfinite = true
					score += 60
					reasons.push('INFINITE_ALLOWANCE')
				} else if (v >= ApprovalsService.HUGE_ALLOWANCE_THRESHOLD) {
					score += 40
					reasons.push('HUGE_ALLOWANCE')
				}
			}
			return {
				riskScore: score,
				riskLevel: scoreToRiskLevel(score),
				riskMeta: {
					reasons,
					isInfinite,
					details
				}
			}
		}

		// ApprovalForAll
		if (dto.kind === ApprovalKindEnum.APPROVAL_FOR_ALL) {
			if (dto.approved === false) return revokeResult

			if (dto.approved === true) {
				score += 70
				reasons.push('APPROVAL_FOR_ALL_ENABLED')
			}

			return {
				riskScore: score,
				riskLevel: scoreToRiskLevel(score),
				riskMeta: {
					reasons,
					isInfinite: false,
					details
				}
			}
		}

		return {
			riskScore: score,
			riskLevel: scoreToRiskLevel(score),
			riskMeta: {
				reasons,
				isInfinite: false,
				details
			}
		}
	}
}

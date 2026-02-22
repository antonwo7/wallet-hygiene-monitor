import { Injectable } from '@nestjs/common'
import { Chain } from '@prisma/client'
import { AllowlistRepository } from './allowlist.repository'

@Injectable()
export class AllowlistService {
	constructor(private readonly repo: AllowlistRepository) {}

	async getTrustedSet(userId: string, chain: Chain, spenders: string[]): Promise<Set<string>> {
		const normalized = Array.from(new Set(spenders.map(s => String(s).toLowerCase()).filter(Boolean)))
		return this.repo.findTrusted(userId, chain, normalized)
	}

	async list(userId: string, chain?: Chain) {
		return this.repo.list(userId, chain)
	}

	async add(userId: string, params: { chain: Chain; spender: string; label?: string }) {
		const spender = String(params.spender).toLowerCase()
		return this.repo.upsertOne({
			userId,
			chain: params.chain,
			spender,
			label: params.label
		})
	}

	async remove(userId: string, params: { chain: Chain; spender: string }) {
		const spender = String(params.spender).toLowerCase()
		const count = await this.repo.deleteOne({ userId, chain: params.chain, spender })
		return { deleted: count }
	}
}

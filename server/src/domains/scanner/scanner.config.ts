import { Injectable, Logger } from '@nestjs/common'
import { Chain } from '@prisma/client'
import { EnvConfig } from '../../shared/config/env.config'

@Injectable()
export class ScannerConfig {
	private readonly logger = new Logger(ScannerConfig.name)

	readonly pollIntervalMs: number

	private readonly rpcUrls: Partial<Record<Chain, string>>

	constructor(private readonly env: EnvConfig) {
		this.pollIntervalMs = this.env.scannerPollIntervalMs

		const eth = this.env.rpcEthereumUrl
		const polygon = this.env.rpcPolygonUrl
		const arbitrum = this.env.rpcArbitrumUrl

		this.rpcUrls = {
			...(eth ? { [Chain.ethereum]: eth } : {}),
			...(polygon ? { [Chain.polygon]: polygon } : {}),
			...(arbitrum ? { [Chain.arbitrum]: arbitrum } : {})
		}

		if (!eth && !polygon && !arbitrum) {
			this.logger.warn(
				'No RPC_*_URL variables are set. Scanner will not be able to run until you configure at least one RPC URL.'
			)
		}
	}

	getRpcUrl(chain: Chain): string {
		const url = this.rpcUrls[chain]
		if (!url) {
			const key =
				chain === Chain.ethereum
					? 'RPC_ETHEREUM_URL'
					: chain === Chain.polygon
						? 'RPC_POLYGON_URL'
						: 'RPC_ARBITRUM_URL'
			throw new Error(`${key} is not defined in the configuration`)
		}
		return url
	}
}

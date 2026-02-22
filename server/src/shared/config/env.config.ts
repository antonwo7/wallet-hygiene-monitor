// env-config.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import type { Env } from './env.schema'
import { Chain } from '@prisma/client'

@Injectable()
export class EnvConfig {
	constructor(private readonly config: ConfigService<Env, true>) {}

	// App
	get port() {
		return this.config.get('PORT', { infer: true })
	}
	get appUrl() {
		return this.config.get('APP_URL', { infer: true })
	}
	get appName() {
		return this.config.get('APP_NAME', { infer: true })
	}
	get corsOriginsRaw() {
		return this.config.get('CORS_ORIGINS', { infer: true })
	}

	// Mail
	get mailFrom() {
		return this.config.get('MAIL_FROM', { infer: true })
	}
	get smtpHost() {
		return this.config.get('SMTP_HOST', { infer: true })
	}
	get smtpUser() {
		return this.config.get('SMTP_USER', { infer: true })
	}
	get smtpPass() {
		return this.config.get('SMTP_PASS', { infer: true })
	}
	get smtpPort() {
		return this.config.get('SMTP_PORT', { infer: true })
	}

	// Cookies
	get cookieDomain() {
		return this.config.get('COOKIE_DOMAIN', { infer: true })
	}
	get cookieSecure() {
		return this.config.get('COOKIE_SECURE', { infer: true })
	}
	get cookieSameSite() {
		return this.config.get('COOKIE_SAMESITE', { infer: true })
	}

	// JWT
	get jwtAccessSecret() {
		return this.config.get('JWT_ACCESS_SECRET', { infer: true })
	}
	get jwtRefreshSecret() {
		return this.config.get('JWT_REFRESH_SECRET', { infer: true })
	}
	get jwtAccessExpiresIn() {
		return this.config.get('JWT_ACCESS_EXPIRES_IN', { infer: true })
	}
	get jwtRefreshExpiresIn() {
		return this.config.get('JWT_REFRESH_EXPIRES_IN', { infer: true })
	}

	// Scanner (realtime)
	get scannerPollIntervalMs() {
		return this.config.get('SCANNER_POLL_INTERVAL_MS', { infer: true })
	}
	scannerConfirmations(chain: Chain) {
		switch (chain) {
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_CONFIRMATIONS', { infer: true })
			case Chain.ethereum:
				return this.config.get('ETH_CONFIRMATIONS', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_CONFIRMATIONS', { infer: true })
			default:
				return this.config.get('ETH_CONFIRMATIONS', { infer: true })
		}
	}
	rpcUrl(chain: Chain) {
		switch (chain) {
			case Chain.arbitrum:
				return this.config.get('RPC_ARBITRUM_URL', { infer: true })
			case Chain.ethereum:
				return this.config.get('RPC_ETHEREUM_URL', { infer: true })
			case Chain.polygon:
				return this.config.get('RPC_POLYGON_URL', { infer: true })
			default:
				return this.config.get('RPC_ETHEREUM_URL', { infer: true })
		}
	}
	get rpcEthereumUrl() {
		return this.config.get('RPC_ETHEREUM_URL', { infer: true })
	}
	get rpcPolygonUrl() {
		return this.config.get('RPC_POLYGON_URL', { infer: true })
	}
	get rpcArbitrumUrl() {
		return this.config.get('RPC_ARBITRUM_URL', { infer: true })
	}

	// Backfill/scanner per-chain getters
	backfillDays(chain: Chain) {
		switch (chain) {
			case Chain.ethereum:
				return this.config.get('ETH_BACKFILL_DAYS', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_BACKFILL_DAYS', { infer: true })
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_BACKFILL_DAYS', { infer: true })
		}
	}

	avgBlockTimeSeconds(chain: Chain) {
		switch (chain) {
			case Chain.ethereum:
				return this.config.get('ETH_AVG_BLOCK_TIME_SECONDS', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_AVG_BLOCK_TIME_SECONDS', { infer: true })
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_AVG_BLOCK_TIME_SECONDS', { infer: true })
		}
	}

	getConfirmations(chain: Chain) {
		switch (chain) {
			case Chain.ethereum:
				return this.config.get('ETH_CONFIRMATIONS', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_CONFIRMATIONS', { infer: true })
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_CONFIRMATIONS', { infer: true })
		}
	}

	getBatchSizeBlocks(chain: Chain) {
		switch (chain) {
			case Chain.ethereum:
				return this.config.get('ETH_BATCH_SIZE_BLOCKS', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_BATCH_SIZE_BLOCKS', { infer: true })
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_BATCH_SIZE_BLOCKS', { infer: true })
		}
	}

	getRateLimitDelayMs(chain: Chain) {
		switch (chain) {
			case Chain.ethereum:
				return this.config.get('ETH_RATE_LIMIT_DELAY_MS', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_RATE_LIMIT_DELAY_MS', { infer: true })
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_RATE_LIMIT_DELAY_MS', { infer: true })
		}
	}

	getMaxRetries(chain: Chain) {
		switch (chain) {
			case Chain.ethereum:
				return this.config.get('ETH_MAX_RETRIES', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_MAX_RETRIES', { infer: true })
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_MAX_RETRIES', { infer: true })
		}
	}

	getAvgBlockTimeSeconds(chain: Chain) {
		switch (chain) {
			case Chain.ethereum:
				return this.config.get('ETH_AVG_BLOCK_TIME_SECONDS', { infer: true })
			case Chain.polygon:
				return this.config.get('POLYGON_AVG_BLOCK_TIME_SECONDS', { infer: true })
			case Chain.arbitrum:
				return this.config.get('ARBITRUM_AVG_BLOCK_TIME_SECONDS', { infer: true })
		}
	}

	// Telegram
	get telegramEnabled() {
		return this.config.get('TELEGRAM_ENABLED', { infer: true })
	}
	get telegramBotToken() {
		return this.config.get('TELEGRAM_BOT_TOKEN', { infer: true })
	}
	get telegramWebhookUrl() {
		return this.config.get('TELEGRAM_WEBHOOK_URL', { infer: true })
	}

	// Logs
	get logFormat() {
		return this.config.get('LOG_FORMAT', { infer: true })
	}
	get logLevel() {
		return this.config.get('LOG_LEVEL', { infer: true })
	}

	explorerTxBaseUrl(chain: Chain): string {
		switch (chain) {
			case Chain.ethereum:
				return process.env.EXPLORER_TX_BASE_ETHEREUM ?? 'https://etherscan.io/tx/'
			case Chain.polygon:
				return process.env.EXPLORER_TX_BASE_POLYGON ?? 'https://polygonscan.com/tx/'
			case Chain.arbitrum:
				return process.env.EXPLORER_TX_BASE_ARBITRUM ?? 'https://arbiscan.io/tx/'
			default:
				return process.env.EXPLORER_TX_BASE_ETHEREUM ?? 'https://etherscan.io/tx/'
		}
	}

	txExplorerUrl(chain: Chain, txHash: string): string {
		return `${this.explorerTxBaseUrl(chain)}${txHash}`
	}

	get eventsPerEmailLimit() {
		return this.config.get('EVENTS_PER_EMAIL_LIMIT', { infer: true })
	}

	// Risk scoring
	get valuableTokensEthereum() {
		return this.config.get('VALUABLE_TOKENS_ETHEREUM', { infer: true })
	}
	get valuableTokensPolygon() {
		return this.config.get('VALUABLE_TOKENS_POLYGON', { infer: true })
	}
	get valuableTokensArbitrum() {
		return this.config.get('VALUABLE_TOKENS_ARBITRUM', { infer: true })
	}
}

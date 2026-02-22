// env.schema.ts
import { z } from 'zod'

const boolFromEnv = z.preprocess(val => {
	if (val === undefined || val === null || val === '') return undefined
	if (typeof val === 'boolean') return val
	if (typeof val === 'number') return val !== 0
	const s = String(val).trim().toLowerCase()
	if (['1', 'true', 'yes', 'y', 'on'].includes(s)) return true
	if (['0', 'false', 'no', 'n', 'off'].includes(s)) return false
	return val
}, z.boolean())

const intFromEnv = z.preprocess(val => {
	if (val === undefined || val === null || val === '') return undefined
	if (typeof val === 'number') return val
	const n = Number(String(val).trim())
	return Number.isFinite(n) ? Math.trunc(n) : val
}, z.number().int())

const numberFromEnv = z.preprocess(val => {
	if (val === undefined || val === null || val === '') return undefined
	if (typeof val === 'number') return val
	const n = Number(String(val).trim())
	return Number.isFinite(n) ? n : val
}, z.number())

export const envSchema = z
	.object({
		// App
		PORT: intFromEnv.default(3000),
		APP_URL: z.string().optional(),
		APP_NAME: z.string().default('Wallet Hygiene Monitor'),
		CORS_ORIGINS: z.string().optional(),

		// Mail
		MAIL_FROM: z.string().default('no-reply@wallet-hygiene.local'),
		SMTP_HOST: z.string().optional(),
		SMTP_USER: z.string().optional(),
		SMTP_PASS: z.string().optional(),
		SMTP_PORT: intFromEnv.default(587),

		// Cookies
		COOKIE_DOMAIN: z.string().optional(),
		COOKIE_SECURE: boolFromEnv.default(false),
		COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),

		// JWT
		JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
		JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
		JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
		JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

		// Scanner (realtime)
		SCANNER_CONFIRMATIONS: intFromEnv.default(5),
		SCANNER_POLL_INTERVAL_MS: intFromEnv.default(30_000),
		RPC_ETHEREUM_URL: z.string().optional(),
		RPC_POLYGON_URL: z.string().optional(),
		RPC_ARBITRUM_URL: z.string().optional(),

		// Backfill / Scanner per-chain
		ETH_BACKFILL_DAYS: intFromEnv.default(30),
		ETH_CONFIRMATIONS: intFromEnv.default(6),
		ETH_BATCH_SIZE_BLOCKS: intFromEnv.default(5000),
		ETH_RATE_LIMIT_DELAY_MS: intFromEnv.default(300),
		ETH_MAX_RETRIES: intFromEnv.default(3),
		ETH_AVG_BLOCK_TIME_SECONDS: numberFromEnv.default(12),

		POLYGON_BACKFILL_DAYS: intFromEnv.default(30),
		POLYGON_CONFIRMATIONS: intFromEnv.default(6),
		POLYGON_BATCH_SIZE_BLOCKS: intFromEnv.default(7000),
		POLYGON_RATE_LIMIT_DELAY_MS: intFromEnv.default(300),
		POLYGON_MAX_RETRIES: intFromEnv.default(3),
		POLYGON_AVG_BLOCK_TIME_SECONDS: numberFromEnv.default(2),

		ARBITRUM_BACKFILL_DAYS: intFromEnv.default(30),
		ARBITRUM_CONFIRMATIONS: intFromEnv.default(6),
		ARBITRUM_BATCH_SIZE_BLOCKS: intFromEnv.default(10_000),
		ARBITRUM_RATE_LIMIT_DELAY_MS: intFromEnv.default(300),
		ARBITRUM_MAX_RETRIES: intFromEnv.default(3),
		ARBITRUM_AVG_BLOCK_TIME_SECONDS: numberFromEnv.default(0.25),

		// Telegram
		TELEGRAM_ENABLED: boolFromEnv.default(false),
		TELEGRAM_BOT_TOKEN: z.string().optional(),
		TELEGRAM_WEBHOOK_URL: z.string().optional(),

		// Logs
		LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
		LOG_LEVEL: z.enum(['debug', 'log', 'info', 'warn', 'error']).default('log'),

		// Emails
		EVENTS_PER_EMAIL_LIMIT: intFromEnv.default(25),

		// Risk scoring (optional lists)
		VALUABLE_TOKENS_ETHEREUM: z.string().optional(),
		VALUABLE_TOKENS_POLYGON: z.string().optional(),
		VALUABLE_TOKENS_ARBITRUM: z.string().optional()
	})
	.passthrough()
	.superRefine((env, ctx) => {
		if (env.TELEGRAM_ENABLED && !env.TELEGRAM_BOT_TOKEN) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'TELEGRAM_BOT_TOKEN is required when TELEGRAM_ENABLED=true',
				path: ['TELEGRAM_BOT_TOKEN']
			})
		}
	})

export type Env = z.infer<typeof envSchema>

export function validateEnv(config: Record<string, unknown>): Env {
	const parsed = envSchema.safeParse(config)
	if (!parsed.success) {
		const message = parsed.error.issues.map(i => `${i.path.join('.') || 'env'}: ${i.message}`).join('; ')
		throw new Error(`Invalid environment variables: ${message}`)
	}
	return parsed.data
}

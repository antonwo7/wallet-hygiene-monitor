import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { Prisma, PrismaClient } from '@prisma/client'
import {
	RepoDbError,
	RepoForeignKeyViolationError,
	RepoInvalidInputError,
	RepoNotFoundError,
	RepoTimeoutError,
	RepoUniqueViolationError
} from '../errors/repo-errors'

function sanitize(value: unknown): unknown {
	const SENSITIVE_KEYS = ['password', 'hash', 'token', 'secret', 'cookie', 'authorization']
	if (Array.isArray(value)) return value.map(sanitize)
	if (value && typeof value === 'object') {
		const out: Record<string, unknown> = {}
		for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
			if (SENSITIVE_KEYS.some(sk => k.toLowerCase().includes(sk))) out[k] = '[REDACTED]'
			else out[k] = sanitize(v)
		}
		return out
	}
	return value
}

function mapPrismaError(err: unknown, details: Record<string, unknown>) {
	if (err instanceof Prisma.PrismaClientKnownRequestError) {
		const meta = err.meta as Record<string, unknown> | undefined
		switch (err.code) {
			case 'P2002':
				return new RepoUniqueViolationError({ ...details, meta }, err)
			case 'P2025':
				return new RepoNotFoundError({ ...details, meta }, err)
			case 'P2003':
				return new RepoForeignKeyViolationError({ ...details, meta }, err)
			case 'P2000':
				return new RepoInvalidInputError({ ...details, meta }, err)
			default:
				return new RepoDbError({ ...details, prismaCode: err.code, meta }, err)
		}
	}

	if (err instanceof Prisma.PrismaClientInitializationError) {
		return new RepoDbError({ ...details, prismaInit: true }, err)
	}

	if (err instanceof Prisma.PrismaClientRustPanicError) {
		return new RepoDbError({ ...details, prismaPanic: true }, err)
	}

	const msg = (err as any)?.message as string | undefined
	if (msg && /timeout|timed\s*out/i.test(msg)) {
		return new RepoTimeoutError({ ...details }, err)
	}

	return null
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
	private readonly log = new Logger('DB')

	readonly client: PrismaClient

	constructor() {
		const base = new PrismaClient()

		this.client = base.$extends({
			query: {
				$allModels: {
					async $allOperations({ model, operation, args, query }) {
						const op = model ? `${model}.${operation}` : `prisma.${operation}`
						const start = Date.now()

						try {
							const res = await query(args)
							;(this as any).log?.debug?.(
								JSON.stringify({
									event: 'db.ok',
									model,
									action: operation,
									op,
									durationMs: Date.now() - start
								})
							)
							return res
						} catch (err) {
							const durationMs = Date.now() - start
							const details = {
								op,
								model,
								action: operation,
								durationMs,
								args: sanitize(args)
							}
							const mapped = mapPrismaError(err, details)

							;(this as any).log?.debug?.(
								JSON.stringify({
									event: 'db.fail',
									model,
									action: operation,
									op,
									durationMs,
									code: mapped ? (mapped as any).code : undefined
								})
							)

							throw mapped ?? err
						}
					}
				}
			}
		}) as PrismaClient
		;(this.client as any).log = this.log
	}

	async onModuleInit() {
		await this.client.$connect()
	}

	async onModuleDestroy() {
		await this.client.$disconnect()
	}
}

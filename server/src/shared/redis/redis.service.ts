import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import Redis from 'ioredis'
import { EnvConfig } from '../config/env.config'

@Injectable()
export class RedisService implements OnModuleDestroy {
	private readonly log = new Logger('RedisService')
	private readonly client: Redis

	constructor(env: EnvConfig) {
		const url = env.redisUrl?.trim() || 'redis://localhost:6379'
		this.client = new Redis(url, {
			maxRetriesPerRequest: 2,
			enableReadyCheck: true,
			lazyConnect: false
		})

		this.client.on('error', err => {
			this.log.error('redis error', err as any)
		})
		this.client.on('connect', () => {
			this.log.log('redis connected')
		})
	}

	get raw() {
		return this.client
	}

	async onModuleDestroy() {
		try {
			await this.client.quit()
		} catch {
			await this.client.disconnect()
		}
	}
}

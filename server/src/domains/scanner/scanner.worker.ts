import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ScannerService } from './scanner.service'
import { ScannerConfig } from './scanner.config'

@Injectable()
export class ScannerWorker implements OnModuleInit, OnModuleDestroy {
	private readonly log = new Logger('scanner.worker')
	private timer: NodeJS.Timeout | null = null
	private running = false

	constructor(
		private readonly scanner: ScannerService,
		private readonly cfg: ScannerConfig
	) {}

	onModuleInit() {
		const interval = this.cfg.pollIntervalMs
		this.log.log(`starting scanner worker, interval=${interval}ms`)

		this.tick()

		this.timer = setInterval(() => void this.tick(), interval)
	}

	onModuleDestroy() {
		if (this.timer) clearInterval(this.timer)
		this.timer = null
	}

	private async tick() {
		if (this.running) return
		this.running = true

		try {
			await this.scanner.scanTick()
		} catch (e: any) {
			this.log.error('scanTick failed', e?.stack ?? String(e))
		} finally {
			this.running = false
		}
	}
}

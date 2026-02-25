import { Injectable } from '@nestjs/common'
import {
	Counter,
	Registry,
	collectDefaultMetrics,
	Histogram
} from 'prom-client'

@Injectable()
export class MetricsService {
	private readonly registry = new Registry()

	private readonly authLoginTotal: Counter<'result'>
	private readonly authResetRequestTotal: Counter<'result'>
	private readonly authRateLimitedTotal: Counter<'route'>
	private readonly authLockedTotal: Counter
	private readonly httpDurationMs: Histogram<'method' | 'route' | 'status'>

	constructor() {
		collectDefaultMetrics({ register: this.registry })

		this.authLoginTotal = new Counter({
			name: 'auth_login_total',
			help: 'Login attempts',
			labelNames: ['result'],
			registers: [this.registry]
		})
		this.authResetRequestTotal = new Counter({
			name: 'auth_reset_request_total',
			help: 'Password reset requests',
			labelNames: ['result'],
			registers: [this.registry]
		})
		this.authRateLimitedTotal = new Counter({
			name: 'auth_rate_limited_total',
			help: 'Rate limited auth requests',
			labelNames: ['route'],
			registers: [this.registry]
		})
		this.authLockedTotal = new Counter({
			name: 'auth_locked_total',
			help: 'Auth lockouts triggered',
			registers: [this.registry]
		})
		this.httpDurationMs = new Histogram({
			name: 'http_request_duration_ms',
			help: 'HTTP request duration in ms',
			labelNames: ['method', 'route', 'status'],
			registers: [this.registry],
			buckets: [10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
		})
	}

	get contentType() {
		return this.registry.contentType
	}

	async metrics() {
		return await this.registry.metrics()
	}

	incLogin(result: 'success' | 'fail') {
		this.authLoginTotal.inc({ result })
	}

	incResetRequest(result: 'success' | 'fail' | 'ignored') {
		this.authResetRequestTotal.inc({ result })
	}

	incAuthRateLimited(route: string) {
		this.authRateLimitedTotal.inc({ route })
	}

	incAuthLocked() {
		this.authLockedTotal.inc()
	}

	observeHttpDuration(method: string, route: string, status: string, durationMs: number) {
		this.httpDurationMs.observe({ method, route, status }, durationMs)
	}
}

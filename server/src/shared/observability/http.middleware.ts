import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'crypto'
import { MetricsService } from '../telemetry/metrics.service'

declare global {
	namespace Express {
		interface Request {
			requestId?: string
		}
	}
}

@Injectable()
export class HttpMiddleware implements NestMiddleware {
	private readonly log = new Logger('HTTP')

	constructor(private readonly metrics: MetricsService) {}

	use(req: any, res: any, next: () => void) {
		const start = Date.now()
		const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID()
		req.requestId = requestId
		res.setHeader('x-request-id', requestId)

		this.log.log('in', {
			requestId,
			method: req.method,
			path: req.originalUrl ?? req.url
		})

		res.on('finish', () => {
			const durationMs = Date.now() - start
			this.log.log('out', {
				requestId,
				method: req.method,
				path: req.originalUrl ?? req.url,
				statusCode: res.statusCode,
				durationMs
			})

			// Basic Prometheus metric. Route is best-effort: use the raw URL.
			this.metrics.observeHttpDuration(
				String(req.method),
				String(req.originalUrl ?? req.url),
				String(res.statusCode),
				durationMs
			)
		})

		next()
	}
}

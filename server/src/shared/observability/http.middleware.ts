import { Injectable, Logger, type NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'crypto'

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
			this.log.log('out', {
				requestId,
				method: req.method,
				path: req.originalUrl ?? req.url,
				statusCode: res.statusCode,
				durationMs: Date.now() - start
			})
		})

		next()
	}
}

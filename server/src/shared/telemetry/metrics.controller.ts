import { Controller, Get, Res } from '@nestjs/common'
import type { Response } from 'express'
import { MetricsService } from './metrics.service'

@Controller()
export class MetricsController {
	constructor(private readonly metrics: MetricsService) {}

	@Get('metrics')
	async getMetrics(@Res() res: Response) {
		res.setHeader('Content-Type', this.metrics.contentType)
		res.send(await this.metrics.metrics())
	}
}

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/prisma/prisma.service'
import { AuthEventType } from '@prisma/client'

@Injectable()
export class AuthAttemptsService {
	constructor(private readonly prisma: PrismaService) {}

	async logAttempt(input: {
		type: AuthEventType
		identifier: string
		email?: string | null
		ip?: string | null
		userAgent?: string | null
		success: boolean
		reason?: string | null
	}) {
		await this.prisma.client.authAttempt.create({
			data: {
				type: input.type,
				identifier: input.identifier,
				email: input.email ?? null,
				ip: input.ip ?? null,
				userAgent: input.userAgent ?? null,
				success: input.success,
				reason: input.reason ?? null
			}
		})
	}
}

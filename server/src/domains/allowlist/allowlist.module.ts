import { Module } from '@nestjs/common'
import { AllowlistService } from './allowlist.service'
import { AllowlistController } from './allowlist.controller'
import { AuthModule } from '../auth/auth.module'
import { AllowlistRepository } from './allowlist.repository'

@Module({
	imports: [AuthModule],
	controllers: [AllowlistController],
	providers: [AllowlistRepository, AllowlistService],
	exports: [AllowlistService]
})
export class AllowlistModule {}

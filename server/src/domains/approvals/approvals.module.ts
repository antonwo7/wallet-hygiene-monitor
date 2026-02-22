import { Module } from '@nestjs/common'
import { ApprovalsController } from './approvals.controller'
import { ApprovalsService } from './approvals.service'
import { ApprovalsRepository } from './approvals.repository'
import { AuthModule } from '../auth/auth.module'
import { WalletsModule } from '../wallets/wallets.module'
import { AllowlistModule } from '../allowlist/allowlist.module'

@Module({
	imports: [AuthModule, WalletsModule, AllowlistModule],
	controllers: [ApprovalsController],
	providers: [ApprovalsService, ApprovalsRepository],
	exports: [ApprovalsService]
})
export class ApprovalsModule {}

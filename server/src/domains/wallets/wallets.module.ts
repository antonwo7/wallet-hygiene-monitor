import { Module } from '@nestjs/common'
import { WalletsController } from './wallets.controller'
import { WalletsService } from './services/wallets.service'
import { WalletsRepository } from './repositories/wallets.repository'
import { WalletStateRepository } from './repositories/wallet-state.repository'
import { AuthModule } from '../auth/auth.module'
import { SharedConfigModule } from '../../shared/config/shared-config.module'

@Module({
	imports: [AuthModule, SharedConfigModule],
	controllers: [WalletsController],
	providers: [WalletsService, WalletsRepository, WalletStateRepository],
	exports: [WalletsService, WalletsRepository, WalletStateRepository]
})
export class WalletsModule {}

import { Module } from '@nestjs/common'
import { ScannerService } from './scanner.service'
import { ScannerRepository } from './scanner.repository'
import { ScannerConfig } from './scanner.config'
import { ScannerWorker } from './scanner.worker'
import { WalletsModule } from '../wallets/wallets.module'
import { ApprovalsModule } from '../approvals/approvals.module'
import { NotificationsModule } from '../notifications/notifications.module'
import { SharedConfigModule } from '../../shared/config/shared-config.module'
import { MailModule } from '../../shared/mail/mail.module'

@Module({
	imports: [SharedConfigModule, WalletsModule, ApprovalsModule, NotificationsModule, MailModule],
	providers: [ScannerService, ScannerRepository, ScannerConfig, ScannerWorker],
	exports: [ScannerService]
})
export class ScannerModule {}

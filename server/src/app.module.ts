import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { validateEnv } from './shared/config/env.schema'
import { SharedConfigModule } from './shared/config/shared-config.module'
import { PrismaModule } from './shared/prisma/prisma.module'
import { MailModule } from './shared/mail/mail.module'
import { HttpMiddleware } from './shared/observability/http.middleware'
import { AuthModule } from './domains/auth/auth.module'
import { UsersModule } from './domains/users/users.module'
import { WalletsModule } from './domains/wallets/wallets.module'
import { ApprovalsModule } from './domains/approvals/approvals.module'
import { ScannerModule } from './domains/scanner/scanner.module'
import { NotificationsModule } from './domains/notifications/notifications.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: ['.env'],
			validate: validateEnv
		}),
		SharedConfigModule,
		PrismaModule,
		MailModule,
		UsersModule,
		AuthModule,
		WalletsModule,
		ApprovalsModule,
		ScannerModule,
		NotificationsModule
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer) {
		consumer.apply(HttpMiddleware).forRoutes('*')
	}
}

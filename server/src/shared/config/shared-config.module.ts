import { Global, Module } from '@nestjs/common'
import { AppConfig } from './app.config'
import { EnvConfig } from './env.config'

@Global()
@Module({
	providers: [EnvConfig, AppConfig],
	exports: [EnvConfig, AppConfig],
})
export class SharedConfigModule {}

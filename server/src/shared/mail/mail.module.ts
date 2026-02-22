import { Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { MailConfig } from './mail.config'

@Module({
  providers: [MailConfig, MailService],
  exports: [MailService],
})
export class MailModule {}

import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import { AppModule } from './app.module'
import { AppConfig } from './shared/config/app.config'
import { GlobalExceptionFilter } from './shared/observability/http-exception.filter'

async function bootstrap() {
	const app = await NestFactory.create(AppModule, { bufferLogs: true })
	app.flushLogs()

  const cfg = app.get(AppConfig)

  app.use(cookieParser())

  app.enableCors({
    origin: cfg.corsOrigins,
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  )

	app.useGlobalFilters(new GlobalExceptionFilter())

	await app.listen(cfg.port)
}

void bootstrap()

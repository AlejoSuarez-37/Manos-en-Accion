import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  if (config.get<string>('NODE_ENV') === 'production') {
    app.set('trust proxy', 1);
  }

  const origins = config
    .getOrThrow<string>('CORS_ORIGIN')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({ origin: origins, credentials: true });
  app.enableCsrfProtection({ trustedOrigins: origins });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Manos en Accion')
    .setVersion('1.0')
    .addCookieAuth('__Host-sid')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.getOrThrow<number>('PORT'));
}
await bootstrap();
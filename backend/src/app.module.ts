import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthenticationModule, type Duration } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ContentPolicy } from './authorization/content.policy.js';
import { AdminPolicy } from './authorization/admin.policy.js';
import { envSchema } from './config/env.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    UsersModule,
    AuthenticationModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        accessToken: {
          key: config.getOrThrow<string>('JWT_SECRET'),
          issuer: config.getOrThrow<string>('JWT_ISSUER'),
          audience: config.getOrThrow<string>('JWT_AUDIENCE'),
          ttl: config.getOrThrow<string>('ACCESS_TOKEN_TTL') as Duration,
        },
        refreshToken: {
          ttl: config.getOrThrow<string>('REFRESH_TOKEN_TTL') as Duration,
          absoluteTtl: config.getOrThrow<string>('REFRESH_TOKEN_ABSOLUTE_TTL') as Duration,
        },
        allowInMemoryStorage: true,
      }),
    }),
    AuthorizationModule.forRoot({
      policies: [ContentPolicy, AdminPolicy],
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

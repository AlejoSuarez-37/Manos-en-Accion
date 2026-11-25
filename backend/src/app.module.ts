import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { AuthenticationModule, type Duration } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ContentPolicy } from './authorization/content.policy.js';
import { AdminPolicy } from './authorization/admin.policy.js';
import { envSchema } from './schemas/env.schemas.js';
import { CreateUsersTable1763740800000 } from './migrations/1763740800000-CreateUsersTable.js';
import { UsersModule } from './users/users.module.js';
import { CreateAuthSessionsTable1763740800001 } from './migrations/1763740800001-CreateAuthSessionsTable.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envSchema,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isTest = config.get<string>('NODE_ENV') === 'test';

        return {
          type: 'postgres',
          url: config.getOrThrow<string>(
            isTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL',
          ),
          autoLoadEntities: true,
          synchronize: false,
          migrations: [
            CreateUsersTable1763740800000,
            CreateAuthSessionsTable1763740800001,
          ],
          migrationsRun: true,
          dropSchema: isTest,
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'ip',
        ttl: 60_000,
        limit: 10,
      },
      {
        name: 'account',
        ttl: 15 * 60_000,
        limit: 5,
        getTracker: (req: Record<string, any>) => {
          const email = (req.body as { email?: unknown } | undefined)?.email;
          return typeof email === 'string'
            ? email.trim().toLowerCase()
            : (req.ip as string | undefined) ?? 'anonymous';
        },
      },
    ]),
    UsersModule,
    AuthenticationModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        session: {
          absoluteTtl: (config.get<string>('SESSION_ABSOLUTE_TTL') ??
            '7d') as Duration,
          idleTtl: (config.get<string>('SESSION_IDLE_TTL') ?? '1d') as Duration,
          cookie: {
            secure: config.get<string>('NODE_ENV') !== 'test',
          },
          trustedOrigins: config
            .getOrThrow<string>('CORS_ORIGIN')
            .split(',')
            .map((origin) => origin.trim()),
        },
      }),
    }),
    AuthorizationModule.forRoot({
      policies: [ContentPolicy, AdminPolicy],
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
  ],
})
export class AppModule { }

import { Module, StandardSchemaValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { AuthenticationModule, type Duration } from '@nestjs/authentication';
import { AuthorizationModule } from '@nestjs/authorization';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ContentPolicy } from './authorization/content.policy.js';
import { AdminPolicy } from './authorization/admin.policy.js';
import { envSchema } from './schemas/env.schemas.js';
import { CreateUsersTable1763740800000 } from './migrations/1763740800000-CreateUsersTable.js';
import { CreateTeamMembersTable1764153600000 } from './migrations/1764153600000-CreateTeamMembersTable.js';
import { DropTeamMemberActiveColumn1764240000000 } from './migrations/1764240000000-DropTeamMemberActiveColumn.js';
import { UsersModule } from './users/users.module.js';
import { TeamMembersModule } from './team/team-members.module.js';

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
            CreateTeamMembersTable1764153600000,
            DropTeamMemberActiveColumn1764240000000,
          ],
          migrationsRun: true,
          dropSchema: isTest,
        };
      },
    }),
    UsersModule,
    TeamMembersModule,
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
          absoluteTtl: config.getOrThrow<string>(
            'REFRESH_TOKEN_ABSOLUTE_TTL',
          ) as Duration,
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
  providers: [
    AppService,
    { provide: APP_PIPE, useClass: StandardSchemaValidationPipe },
  ],
})
export class AppModule {}

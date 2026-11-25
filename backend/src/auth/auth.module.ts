import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module.js';
import { AuthSession } from './entities/auth-session.entity.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { SessionAuthProvider } from './providers/session-auth.provider.js';
import { AuthSessionStore } from './stores/auth-session.store.js';
import './auth.types.js';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([AuthSession])],
  controllers: [AuthController],
  providers: [AuthService, SessionAuthProvider, AuthSessionStore],
})
export class AuthModule { }
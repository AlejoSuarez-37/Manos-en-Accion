import { Module } from '@nestjs/common';
import { UsersRepository } from './users.repository.js';
import { UsersSeed } from './users.seed.js';

@Module({
  providers: [UsersRepository, UsersSeed],
  exports: [UsersRepository],
})
export class UsersModule {}

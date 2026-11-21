import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.js';
import { UsersSeed } from './users.seed.js';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersSeed],
  exports: [TypeOrmModule],
})
export class UsersModule {}

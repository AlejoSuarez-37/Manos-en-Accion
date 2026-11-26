import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module.js';
import { TeamMember } from './entities/team-member.entity.js';
import { TeamMembersController } from './team-members.controller.js';
import { TeamMembersService } from './team-members.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([TeamMember]), StorageModule],
  controllers: [TeamMembersController],
  providers: [TeamMembersService],
  exports: [TypeOrmModule, TeamMembersService],
})
export class TeamMembersModule {}

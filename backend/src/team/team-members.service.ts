import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TEAM_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import type {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
} from '../schemas/team.schemas.js';
import {
  TeamMember,
  type PublicTeamMember,
} from './entities/team-member.entity.js';

@Injectable()
export class TeamMembersService {
  constructor(
    @InjectRepository(TeamMember)
    private readonly members: Repository<TeamMember>,
    private readonly storage: StorageService,
  ) {}

  async findAll(): Promise<PublicTeamMember[]> {
    const members = await this.members.find({ order: { createdAt: 'DESC' } });
    return members.map((member) => this.toPublic(member));
  }

  async findOne(id: string): Promise<PublicTeamMember> {
    return this.toPublic(await this.findOneEntity(id));
  }

  async create(
    input: CreateTeamMemberDto,
    file?: Express.Multer.File,
  ): Promise<PublicTeamMember> {
    const image = await this.storage.uploadImage(file, TEAM_IMAGE_RULE);
    const member = this.members.create({
      name: input.name,
      role: input.role,
      bio: input.bio ?? null,
      imageKey: image.key,
    });

    try {
      const saved = await this.members.save(member);
      return this.toPublic(saved);
    } catch (error) {
      await this.storage.delete(image.key);
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateTeamMemberDto,
    file?: Express.Multer.File,
  ): Promise<PublicTeamMember> {
    const member = await this.findOneEntity(id);
    const previousKey = member.imageKey;
    const image = file
      ? await this.storage.uploadImage(file, TEAM_IMAGE_RULE)
      : undefined;

    try {
      if (image) {
        await this.storage.deleteRequired(previousKey);
      }
      if (input.name !== undefined) {
        member.name = input.name;
      }
      if (input.role !== undefined) {
        member.role = input.role;
      }
      if (input.bio !== undefined) {
        member.bio = input.bio || null;
      }
      if (image) {
        member.imageKey = image.key;
      }

      const saved = await this.members.save(member);
      return this.toPublic(saved);
    } catch (error) {
      if (image) {
        await this.storage.delete(image.key);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const member = await this.findOneEntity(id);
    await this.storage.deleteRequired(member.imageKey);
    const result = await this.members.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException(`Miembro del equipo ${id} no encontrado`);
    }
  }

  private async findOneEntity(id: string): Promise<TeamMember> {
    const member = await this.members.findOneBy({ id });
    if (!member) {
      throw new NotFoundException(`Miembro del equipo ${id} no encontrado`);
    }
    return member;
  }

  private toPublic(member: TeamMember): PublicTeamMember {
    return {
      id: member.id,
      name: member.name,
      role: member.role,
      bio: member.bio ?? null,
      imageUrl: this.storage.getUrl(member.imageKey, TEAM_IMAGE_RULE),
    };
  }
}

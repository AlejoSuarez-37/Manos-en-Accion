import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ContentPolicy } from '../authorization/content.policy.js';
import {
  createTeamMemberSchema,
  teamMemberIdParamSchema,
  updateTeamMemberSchema,
  type CreateTeamMemberDto,
  type UpdateTeamMemberDto,
} from '../schemas/team.schemas.js';
import {
  ApiCreateTeamMember,
  ApiDeleteTeamMember,
  ApiFindTeamMembers,
  ApiFindOneTeamMember,
  ApiUpdateTeamMember,
} from './decorators/team-members-swagger.decorator.js';
import { TeamMembersService } from './team-members.service.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const imageUpload = () =>
  UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  );

@Controller('team-members')
export class TeamMembersController {
  constructor(private readonly teamMembersService: TeamMembersService) {}

  @Get()
  @Public()
  @ApiFindTeamMembers()
  findAll() {
    return this.teamMembersService.findAll();
  }

  @Get(':id')
  @ApiFindOneTeamMember()
  @Can(ContentPolicy, 'manage')
  findOne(@Param('id', { schema: teamMemberIdParamSchema }) id: string) {
    return this.teamMembersService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @imageUpload()
  @ApiCreateTeamMember()
  @Can(ContentPolicy, 'manage')
  create(
    @Body({ schema: createTeamMemberSchema }) input: CreateTeamMemberDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.teamMembersService.create(input, file);
  }

  @Patch(':id')
  @imageUpload()
  @ApiUpdateTeamMember()
  @Can(ContentPolicy, 'manage')
  update(
    @Param('id', { schema: teamMemberIdParamSchema }) id: string,
    @Body({ schema: updateTeamMemberSchema }) input: UpdateTeamMemberDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.teamMembersService.update(id, input, file);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiDeleteTeamMember()
  @Can(ContentPolicy, 'manage')
  async remove(
    @Param('id', { schema: teamMemberIdParamSchema }) id: string,
  ): Promise<void> {
    await this.teamMembersService.remove(id);
  }
}

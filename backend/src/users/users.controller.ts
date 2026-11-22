import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { AdminPolicy } from '../authorization/admin.policy.js';
import type { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  type CreateUserDto,
  type UpdateUserDto,
} from '../schemas/users.schemas.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Can(AdminPolicy, 'manageEditors')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Can(AdminPolicy, 'manageEditors')
  findOne(@Param('id', { schema: userIdParamSchema }) id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @Can(AdminPolicy, 'manageEditors')
  create(@Body({ schema: createUserSchema }) input: CreateUserDto) {
    return this.usersService.create(input);
  }

  @Patch(':id')
  @Can(AdminPolicy, 'manageEditors')
  update(
    @CurrentUser() currentUser: User,
    @Param('id', { schema: userIdParamSchema }) id: string,
    @Body({ schema: updateUserSchema }) input: UpdateUserDto,
  ) {
    return this.usersService.update(currentUser, id, input);
  }

  @Delete(':id')
  @HttpCode(204)
  @Can(AdminPolicy, 'manageEditors')
  async remove(
    @CurrentUser() currentUser: User,
    @Param('id', { schema: userIdParamSchema }) id: string,
  ): Promise<void> {
    await this.usersService.remove(currentUser, id);
  }
}

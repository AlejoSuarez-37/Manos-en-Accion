import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordHasher, TokenService } from '@nestjs/authentication';
import { AuthorizationService } from '@nestjs/authorization';
import { QueryFailedError, Repository } from 'typeorm';
import { AdminPolicy } from '../authorization/admin.policy.js';
import { User, normalizeEmail } from './user.js';
import type { CreateUserDto, UpdateUserDto } from './users.schemas.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly authorizationService: AuthorizationService,
  ) {}

  async findAll(): Promise<User[]> {
    const users = await this.users.find();
    return users.map(toPublicUser);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.users.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return toPublicUser(user);
  }

  async create(input: CreateUserDto): Promise<User> {
    const email = normalizeEmail(input.email);
    if (await this.users.findOneBy({ email })) {
      throw new ConflictException('A user with this email already exists');
    }

    const user = this.users.create({
      email,
      name: input.name.trim(),
      role: 'editor',
      passwordHash: await this.passwordHasher.hash(input.password),
    });

    const saved = await this.save(user);
    return toPublicUser(saved);
  }

  async update(
    currentUser: User,
    id: string,
    input: UpdateUserDto,
  ): Promise<User> {
    const user = await this.findOne(id);
    await this.authorizationService.authorize(
      AdminPolicy,
      'manageEditor',
      currentUser,
      user,
    );

    if (input.name !== undefined) {
      user.name = input.name.trim();
    }
    if (input.email !== undefined) {
      user.email = normalizeEmail(input.email);
    }
    if (input.password !== undefined) {
      user.passwordHash = await this.passwordHasher.hash(input.password);
    }

    const saved = await this.save(user);
    if (input.password !== undefined) {
      await this.tokenService.revokeAll(saved.id);
    }
    return toPublicUser(saved);
  }

  async remove(currentUser: User, id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.authorizationService.authorize(
      AdminPolicy,
      'manageEditor',
      currentUser,
      user,
    );

    const userId = user.id;
    await this.users.remove(user);
    await this.tokenService.revokeAll(userId);
  }

  private async save(user: User): Promise<User> {
    try {
      return await this.users.save(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }
}

const toPublicUser = (user: User): User => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
});

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string } | undefined)?.code === '23505';

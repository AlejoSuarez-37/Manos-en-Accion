import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  PasswordHasher,
  SessionService,
  SignInService,
} from '@nestjs/authentication';
import { Repository } from 'typeorm';
import {
  User,
  normalizeEmail,
  toPublicUser,
} from '../users/entities/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly passwordHasher: PasswordHasher,
    private readonly signInService: SignInService,
    private readonly sessions: SessionService,
  ) { }

  async login(email: string, password: string): Promise<User> {
    const found = await this.findCredentialsByEmail(email);
    const valid = await this.passwordHasher.verify(
      password,
      found?.passwordHash,
    );

    if (!found || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (
      found.passwordHash &&
      this.passwordHasher.needsRehash(found.passwordHash)
    ) {
      await this.users.update(found.id, {
        passwordHash: await this.passwordHasher.hash(password),
      });
    }

    await this.signInService.signIn(found.id, { method: 'password' });
    return toPublicUser(found);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const found = await this.findCredentialsById(userId);
    const valid = await this.passwordHasher.verify(
      currentPassword,
      found?.passwordHash,
    );

    if (!found || !valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.users.update(userId, {
      passwordHash: await this.passwordHasher.hash(newPassword),
    });

    const rotated = await this.signInService.rotateSession();
    await this.sessions.revokeAll(userId, { except: rotated?.session.id });
  }

  private findCredentialsByEmail(email: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: normalizeEmail(email) })
      .getOne();
  }

  private findCredentialsById(id: string): Promise<User | null> {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.id = :id', { id })
      .getOne();
  }
}
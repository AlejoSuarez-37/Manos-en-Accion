import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PasswordHasher, TokenService, type IssuedTokens } from '@nestjs/authentication';
import { UsersRepository } from '../users/users.repository.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async login(email: string, password: string): Promise<IssuedTokens> {
    const found = await this.usersRepository.findCredentials(email);
    const valid = await this.passwordHasher.verify(password, found?.passwordHash);

    if (!found || !valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (this.passwordHasher.needsRehash(found.passwordHash)) {
      await this.usersRepository.updatePasswordHash(found.user.id, await this.passwordHasher.hash(password));
    }

    return this.tokenService.issue(found.user.id, { method: 'password' });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const found = await this.usersRepository.findCredentialsById(userId);
    const valid = await this.passwordHasher.verify(currentPassword, found?.passwordHash);

    if (!found || !valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.usersRepository.updatePasswordHash(userId, await this.passwordHasher.hash(newPassword));
    await this.tokenService.revokeAll(userId);
  }
}

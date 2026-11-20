import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordHasher } from '@nestjs/authentication';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersSeed implements OnModuleInit {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedUser(
      this.config.getOrThrow<string>('SEED_ADMIN_EMAIL'),
      this.config.getOrThrow<string>('SEED_ADMIN_PASSWORD'),
      'Administrador',
      'admin',
    );

    const editorEmail = this.config.get<string>('SEED_EDITOR_EMAIL');
    const editorPassword = this.config.get<string>('SEED_EDITOR_PASSWORD');
    if (editorEmail && editorPassword) {
      await this.seedUser(editorEmail, editorPassword, 'Editor', 'editor');
    }
  }

  private async seedUser(email: string, password: string, name: string, role: 'admin' | 'editor'): Promise<void> {
    if (await this.usersRepository.findByEmail(email)) {
      return;
    }

    await this.usersRepository.create({
      email,
      name,
      role,
      passwordHash: await this.passwordHasher.hash(password),
    });
  }
}

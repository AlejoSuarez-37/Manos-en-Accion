import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PasswordHasher } from '@nestjs/authentication';
import { Repository } from 'typeorm';
import { User, normalizeEmail, type Role } from './user.js';

@Injectable()
export class UsersSeed implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
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

  private async seedUser(
    email: string,
    password: string,
    name: string,
    role: Role,
  ): Promise<void> {
    const normalizedEmail = normalizeEmail(email);
    if (await this.users.findOneBy({ email: normalizedEmail })) {
      return;
    }

    const user = this.users.create({
      email: normalizedEmail,
      name: name.trim(),
      role,
      passwordHash: await this.passwordHasher.hash(password),
    });
    await this.users.save(user);
  }
}

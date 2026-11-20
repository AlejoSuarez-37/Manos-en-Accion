import { Injectable } from '@nestjs/common';
import {
  AuthenticationRegistry,
  JwtBearerProvider,
  type JwtClaims,
} from '@nestjs/authentication';
import { UsersRepository } from '../users/users.repository.js';
import type { User } from '../users/user.js';

@Injectable()
export class JwtAuthProvider extends JwtBearerProvider<User> {
  constructor(
    private readonly usersRepository: UsersRepository,
    registry: AuthenticationRegistry,
  ) {
    super({ realm: 'manos-en-accion' });
    registry.registerProvider(this);
  }

  protected validate({ sub }: JwtClaims): Promise<User | null> {
    return sub ? this.usersRepository.findById(sub) : Promise.resolve(null);
  }
}

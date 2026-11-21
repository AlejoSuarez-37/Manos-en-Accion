import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  AuthenticationRegistry,
  JwtBearerProvider,
  type JwtClaims,
} from '@nestjs/authentication';
import { Repository } from 'typeorm';
import { User } from '../users/user.js';

@Injectable()
export class JwtAuthProvider extends JwtBearerProvider<User> {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    registry: AuthenticationRegistry,
  ) {
    super({ realm: 'manos-en-accion' });
    registry.registerProvider(this);
  }

  protected validate({ sub }: JwtClaims): Promise<User | null> {
    return sub ? this.users.findOneBy({ id: sub }) : Promise.resolve(null);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    AuthenticationRegistry,
    SessionCookieProvider,
    type SessionRecord,
} from '@nestjs/authentication';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Injectable()
export class SessionAuthProvider extends SessionCookieProvider<User> {
    constructor(
        @InjectRepository(User)
        private readonly users: Repository<User>,
        registry: AuthenticationRegistry,
    ) {
        super();
        registry.registerProvider(this);
    }

    protected validate(session: SessionRecord): Promise<User | null> {
        return this.users.findOneBy({ id: session.userId });
    }
}

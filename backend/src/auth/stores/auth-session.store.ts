import { Injectable } from '@nestjs/common';
import {
    AuthenticationStorage,
    type SessionRecord,
    type SessionStore,
} from '@nestjs/authentication';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, type QueryDeepPartialEntity } from 'typeorm';
import { AuthSession } from '../entities/auth-session.entity.js';

@Injectable()
export class AuthSessionStore implements SessionStore {
    constructor(
        @InjectRepository(AuthSession)
        private readonly repo: Repository<AuthSession>,
        storage: AuthenticationStorage,
    ) {
        storage.registerSource({ sessions: this });
    }

    async getSession(id: string): Promise<SessionRecord | undefined> {
        const row = await this.repo.findOne({ where: { id } });
        return row ? toRecord(row) : undefined;
    }


    async createSession(record: SessionRecord): Promise<void> {
        await this.repo.delete({ expiresAt: LessThan(record.createdAt) });
        await this.repo.insert(toRow(record) as QueryDeepPartialEntity<AuthSession>);
    }

    async touchSession(id: string, lastActiveAt: Date): Promise<void> {
        await this.repo.update(
            { id, lastActiveAt: LessThan(lastActiveAt) },
            { lastActiveAt } as QueryDeepPartialEntity<AuthSession>,
        );
    }

    async deleteSession(id: string): Promise<boolean> {
        const result = await this.repo.delete({ id });
        return (result.affected ?? 0) > 0;
    }

    async listUserSessions(userId: string): Promise<SessionRecord[]> {
        const rows = await this.repo.find({ where: { userId } });
        return rows.map(toRecord);
    }

    async deleteUserSessions(userId: string): Promise<void> {
        await this.repo.delete({ userId });
    }
}

const toRecord = (row: AuthSession): SessionRecord => ({
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
    lastActiveAt: row.lastActiveAt,
    ...(row.mfa ? { mfa: row.mfa } : {}),
    ...(row.metadata ? { metadata: row.metadata } : {}),
});

const toRow = (record: SessionRecord): Partial<AuthSession> => ({
    id: record.id,
    userId: record.userId,
    createdAt: record.createdAt,
    expiresAt: record.expiresAt,
    lastActiveAt: record.lastActiveAt,
    mfa: record.mfa,
    metadata: record.metadata,
});
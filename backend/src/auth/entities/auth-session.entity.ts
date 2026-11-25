import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import type { MfaState } from '@nestjs/authentication';

@Entity('auth_sessions')
export class AuthSession {
    @PrimaryColumn({ type: 'varchar', length: 64 })
    id: string;

    @Index('IDX_auth_sessions_user_id')
    @Column({ name: 'user_id', type: 'varchar', length: 255 })
    userId: string;

    @Column({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;

    @Column({ name: 'last_active_at', type: 'timestamptz' })
    lastActiveAt: Date;

    @Column({ name: 'mfa', type: 'jsonb', nullable: true })
    mfa?: MfaState;

    @Column({ name: 'metadata', type: 'jsonb', nullable: true })
    metadata?: Record<string, unknown>;
}
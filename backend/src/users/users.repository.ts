import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Role, User } from './user.js';

interface UserRow extends User {
  passwordHash: string;
}

export interface CreateUserInput {
  email: string;
  name: string;
  role: Role;
  passwordHash: string;
}

export interface UserCredentials {
  user: User;
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  private readonly rows = new Map<string, UserRow>();

  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    if (this.findRowByEmail(email)) {
      throw new Error(`A user with email ${email} already exists`);
    }

    const row: UserRow = {
      id: randomUUID(),
      email,
      name: input.name.trim(),
      role: input.role,
      createdAt: new Date(),
      passwordHash: input.passwordHash,
    };
    this.rows.set(row.id, row);
    return toUser(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = this.rows.get(id);
    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = this.findRowByEmail(email);
    return row ? toUser(row) : null;
  }

  async findCredentials(email: string): Promise<UserCredentials | null> {
    const row = this.findRowByEmail(email);
    return row ? { user: toUser(row), passwordHash: row.passwordHash } : null;
  }

  async findCredentialsById(id: string): Promise<UserCredentials | null> {
    const row = this.rows.get(id);
    return row ? { user: toUser(row), passwordHash: row.passwordHash } : null;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const row = this.rows.get(id);
    if (!row) {
      throw new Error(`User ${id} not found`);
    }
    row.passwordHash = passwordHash;
  }

  async list(): Promise<User[]> {
    return [...this.rows.values()].map(toUser);
  }

  private findRowByEmail(email: string): UserRow | undefined {
    const normalized = normalizeEmail(email);
    return [...this.rows.values()].find((row) => row.email === normalized);
  }
}

const normalizeEmail = (email: string) => email.trim().normalize('NFC').toLowerCase();

const toUser = ({ id, email, name, role, createdAt }: UserRow): User => ({
  id,
  email,
  name,
  role,
  createdAt,
});

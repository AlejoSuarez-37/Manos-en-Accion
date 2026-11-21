import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const userRoles = ['editor', 'admin'] as const;
export type Role = (typeof userRoles)[number];

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash?: string;

  @Column({
    type: 'enum',
    enum: [...userRoles],
    enumName: 'user_role',
    default: 'editor',
  })
  role: Role;
}

export const normalizeEmail = (email: string) =>
  email.trim().normalize('NFC').toLowerCase();

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { PublicWorkshop } from './workshop.entity.js';

@Entity('focus_areas')
export class FocusArea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  description?: string | null;

  @Column({ name: 'image_key' })
  imageKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface PublicFocusArea {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  workshops: PublicWorkshop[];
}

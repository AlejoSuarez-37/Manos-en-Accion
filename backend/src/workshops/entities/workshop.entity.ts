import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FocusArea } from './focus-area.entity.js';

@Entity('workshops')
export class Workshop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 2000 })
  description: string;

  @Column({ name: 'pdf_key', type: 'varchar', nullable: true })
  pdfKey?: string | null;

  @Column({ name: 'pdf_name', type: 'varchar', length: 120, nullable: true })
  pdfName?: string | null;

  @Column({ name: 'image_key' })
  imageKey: string;

  @ManyToOne(() => FocusArea, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'focus_area_id' })
  focusArea: FocusArea;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface PublicWorkshop {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  pdfUrl: string | null;
  pdfName: string | null;
  focusAreaId: string;
}

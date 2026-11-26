import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  role: string;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  bio?: string | null;

  @Column({ name: 'image_key' })
  imageKey: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface PublicTeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  imageUrl: string;
}

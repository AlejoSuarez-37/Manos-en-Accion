import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('banners')
export class Banner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'int' })
    position: number;

    @Column({ name: 'image_key' })
    imageKey: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

export interface PublicBanner {
    id: string;
    position: number;
    imageUrl: string;
}

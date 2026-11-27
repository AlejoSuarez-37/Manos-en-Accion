import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export const sponsorCategories = [
    'corporate_support',
    'friend_organizations',
] as const;

export type SponsorCategory = (typeof sponsorCategories)[number];

@Entity('sponsors')
export class Sponsor {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: [...sponsorCategories],
        enumName: 'sponsor_category',
    })
    category: SponsorCategory;

    @Column({ name: 'website_url', type: 'varchar', length: 2048, nullable: true })
    websiteUrl?: string | null;

    @Column({ name: 'image_key' })
    imageKey: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

export interface PublicSponsor {
    id: string;
    name: string;
    category: SponsorCategory;
    websiteUrl: string | null;
    imageUrl: string;
}
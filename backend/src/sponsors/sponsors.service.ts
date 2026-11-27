import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SPONSOR_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import type {
    CreateSponsorDto,
    ListSponsorsQueryDto,
    UpdateSponsorDto,
} from '../schemas/sponsors.schemas.js';
import { Sponsor, type PublicSponsor } from './entities/sponsor.entity.js';

@Injectable()
export class SponsorsService {
    constructor(
        @InjectRepository(Sponsor)
        private readonly sponsors: Repository<Sponsor>,
        private readonly storage: StorageService,
    ) { }

    async findAll(query: ListSponsorsQueryDto = {}): Promise<PublicSponsor[]> {
        const sponsors = await this.sponsors.find({
            where: query.category ? { category: query.category } : {},
            order: { createdAt: 'DESC' },
        });
        return sponsors.map((sponsor) => this.toPublic(sponsor));
    }

    async findOne(id: string): Promise<PublicSponsor> {
        return this.toPublic(await this.findOneEntity(id));
    }

    async create(
        input: CreateSponsorDto,
        file?: Express.Multer.File,
    ): Promise<PublicSponsor> {
        const image = await this.storage.uploadImage(file, SPONSOR_IMAGE_RULE);
        const sponsor = this.sponsors.create({
            name: input.name,
            category: input.category,
            websiteUrl: input.websiteUrl ?? null,
            imageKey: image.key,
        });

        try {
            const saved = await this.sponsors.save(sponsor);
            return this.toPublic(saved);
        } catch (error) {
            await this.storage.delete(image.key);
            throw error;
        }
    }

    async update(
        id: string,
        input: UpdateSponsorDto,
        file?: Express.Multer.File,
    ): Promise<PublicSponsor> {
        if (!file && Object.keys(input).length === 0) {
            throw new BadRequestException('Debe enviar al menos un campo o una imagen');
        }
        const sponsor = await this.findOneEntity(id);
        const previousKey = sponsor.imageKey;
        const image = file
            ? await this.storage.uploadImage(file, SPONSOR_IMAGE_RULE)
            : undefined;

        try {
            if (image) {
                await this.storage.deleteRequired(previousKey);
            }
            if (input.name !== undefined) {
                sponsor.name = input.name;
            }
            if (input.category !== undefined) {
                sponsor.category = input.category;
            }
            if (input.websiteUrl !== undefined) {
                sponsor.websiteUrl = input.websiteUrl;
            }
            if (image) {
                sponsor.imageKey = image.key;
            }

            const saved = await this.sponsors.save(sponsor);
            return this.toPublic(saved);
        } catch (error) {
            if (image) {
                await this.storage.delete(image.key);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const sponsor = await this.findOneEntity(id);
        await this.storage.deleteRequired(sponsor.imageKey);
        const result = await this.sponsors.delete({ id });

        if (result.affected === 0) {
            throw new NotFoundException(`Sponsor ${id} no encontrado`);
        }
    }

    private async findOneEntity(id: string): Promise<Sponsor> {
        const sponsor = await this.sponsors.findOneBy({ id });
        if (!sponsor) {
            throw new NotFoundException(`Sponsor ${id} no encontrado`);
        }
        return sponsor;
    }

    private toPublic(sponsor: Sponsor): PublicSponsor {
        return {
            id: sponsor.id,
            name: sponsor.name,
            category: sponsor.category,
            websiteUrl: sponsor.websiteUrl ?? null,
            imageUrl: this.storage.getUrl(sponsor.imageKey, SPONSOR_IMAGE_RULE),
        };
    }
}
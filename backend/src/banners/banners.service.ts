import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UpdateBannerDto } from '../schemas/banners.schemas.js';
import { BANNER_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import { Banner, type PublicBanner } from './entities/banner.entity.js';

@Injectable()
export class BannersService {
    constructor(
        @InjectRepository(Banner)
        private readonly banners: Repository<Banner>,
        private readonly storage: StorageService,
    ) { }

    async findAll(): Promise<PublicBanner[]> {
        const banners = await this.banners.find({
            order: { position: 'ASC', createdAt: 'ASC' },
        });
        return banners.map((banner) => this.toPublic(banner));
    }

    async findOne(id: string): Promise<PublicBanner> {
        return this.toPublic(await this.findOneEntity(id));
    }

    async create(file?: Express.Multer.File): Promise<PublicBanner> {
        const last = await this.banners.find({
            order: { position: 'DESC' },
            take: 1,
        });
        const position = (last[0]?.position ?? 0) + 1;
        const image = await this.storage.uploadImage(file, BANNER_IMAGE_RULE);
        const banner = this.banners.create({
            position,
            imageKey: image.key,
        });

        try {
            const saved = await this.banners.save(banner);
            return this.toPublic(saved);
        } catch (error) {
            await this.storage.delete(image.key);
            throw error;
        }
    }

    async update(
        id: string,
        input: UpdateBannerDto,
        file?: Express.Multer.File,
    ): Promise<PublicBanner> {
        if (!file && input.position === undefined) {
            throw new BadRequestException('Debe enviar una posición o una imagen');
        }
        const banner = await this.findOneEntity(id);
        const previousKey = banner.imageKey;
        const image = file
            ? await this.storage.uploadImage(file, BANNER_IMAGE_RULE)
            : undefined;

        try {
            if (image) {
                await this.storage.deleteRequired(previousKey);
            }
            if (input.position !== undefined) {
                banner.position = input.position;
            }
            if (image) {
                banner.imageKey = image.key;
            }

            const saved = await this.banners.save(banner);
            return this.toPublic(saved);
        } catch (error) {
            if (image) {
                await this.storage.delete(image.key);
            }
            throw error;
        }
    }

    async remove(id: string): Promise<void> {
        const banner = await this.findOneEntity(id);
        await this.storage.deleteRequired(banner.imageKey);
        const result = await this.banners.delete({ id });

        if (result.affected === 0) {
            throw new NotFoundException(`Banner ${id} no encontrado`);
        }
    }

    private async findOneEntity(id: string): Promise<Banner> {
        const banner = await this.banners.findOneBy({ id });
        if (!banner) {
            throw new NotFoundException(`Banner ${id} no encontrado`);
        }
        return banner;
    }

    private toPublic(banner: Banner): PublicBanner {
        return {
            id: banner.id,
            position: banner.position,
            imageUrl: this.storage.getUrl(banner.imageKey, BANNER_IMAGE_RULE),
        };
    }
}

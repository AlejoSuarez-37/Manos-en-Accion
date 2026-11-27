import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateFocusAreaDto,
  UpdateFocusAreaDto,
} from '../schemas/workshops.schemas.js';
import { FOCUS_AREA_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import {
  FocusArea,
  type PublicFocusArea,
} from './entities/focus-area.entity.js';
import { Workshop } from './entities/workshop.entity.js';
import { toPublicWorkshop } from './workshop.mapper.js';

@Injectable()
export class FocusAreasService {
  constructor(
    @InjectRepository(FocusArea)
    private readonly focusAreas: Repository<FocusArea>,
    @InjectRepository(Workshop)
    private readonly workshops: Repository<Workshop>,
    private readonly storage: StorageService,
  ) {}

  async findAll(): Promise<PublicFocusArea[]> {
    const [areas, workshops] = await Promise.all([
      this.focusAreas.find({ order: { name: 'ASC' } }),
      this.workshops.find({
        relations: { focusArea: true },
        order: { createdAt: 'DESC' },
      }),
    ]);

    return areas.map((area) =>
      this.toPublic(
        area,
        workshops
          .filter((workshop) => workshop.focusArea.id === area.id)
          .map((workshop) => toPublicWorkshop(workshop, this.storage)),
      ),
    );
  }

  async findOne(id: string): Promise<PublicFocusArea> {
    const area = await this.findOneEntity(id);
    const workshops = await this.workshops.find({
      where: { focusArea: { id } },
      relations: { focusArea: true },
      order: { createdAt: 'DESC' },
    });

    return this.toPublic(
      area,
      workshops.map((workshop) => toPublicWorkshop(workshop, this.storage)),
    );
  }

  async create(
    input: CreateFocusAreaDto,
    file?: Express.Multer.File,
  ): Promise<PublicFocusArea> {
    const image = await this.storage.uploadImage(file, FOCUS_AREA_IMAGE_RULE);
    const area = this.focusAreas.create({
      name: input.name,
      description: input.description ?? null,
      imageKey: image.key,
    });

    try {
      const saved = await this.focusAreas.save(area);
      return this.toPublic(saved, []);
    } catch (error) {
      await this.storage.delete(image.key);
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateFocusAreaDto,
    file?: Express.Multer.File,
  ): Promise<PublicFocusArea> {
    const area = await this.findOneEntity(id);
    const previousKey = area.imageKey;
    const image = file
      ? await this.storage.uploadImage(file, FOCUS_AREA_IMAGE_RULE)
      : undefined;

    try {
      if (image) {
        await this.storage.deleteRequired(previousKey);
      }
      if (input.name !== undefined) {
        area.name = input.name;
      }
      if (input.description !== undefined) {
        area.description = input.description || null;
      }
      if (image) {
        area.imageKey = image.key;
      }

      const saved = await this.focusAreas.save(area);
      const workshops = await this.workshops.find({
        where: { focusArea: { id } },
        relations: { focusArea: true },
      });
      return this.toPublic(
        saved,
        workshops.map((workshop) => toPublicWorkshop(workshop, this.storage)),
      );
    } catch (error) {
      if (image) {
        await this.storage.delete(image.key);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const area = await this.findOneEntity(id);
    const total = await this.workshops.count({
      where: { focusArea: { id } },
    });

    if (total > 0) {
      throw new ConflictException(
        'No se puede eliminar el eje de acción porque tiene talleres asociados',
      );
    }

    await this.storage.deleteRequired(area.imageKey);
    const result = await this.focusAreas.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundException(`Eje de acción ${id} no encontrado`);
    }
  }

  private async findOneEntity(id: string): Promise<FocusArea> {
    const area = await this.focusAreas.findOneBy({ id });
    if (!area) {
      throw new NotFoundException(`Eje de acción ${id} no encontrado`);
    }
    return area;
  }

  private toPublic(
    area: FocusArea,
    workshops: PublicFocusArea['workshops'],
  ): PublicFocusArea {
    return {
      id: area.id,
      name: area.name,
      description: area.description ?? null,
      imageUrl: this.storage.getUrl(area.imageKey, FOCUS_AREA_IMAGE_RULE),
      workshops,
    };
  }
}

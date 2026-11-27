import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  CreateWorkshopDto,
  UpdateWorkshopDto,
} from '../schemas/workshops.schemas.js';
import { PDF_RULE, WORKSHOP_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import type { UploadedPdf } from '../storage/storage.types.js';
import { FocusArea } from './entities/focus-area.entity.js';
import { Workshop, type PublicWorkshop } from './entities/workshop.entity.js';
import { toPublicWorkshop } from './workshop.mapper.js';

@Injectable()
export class WorkshopsService {
  constructor(
    @InjectRepository(Workshop)
    private readonly workshops: Repository<Workshop>,
    @InjectRepository(FocusArea)
    private readonly focusAreas: Repository<FocusArea>,
    private readonly storage: StorageService,
  ) {}

  async findAll(focusAreaId?: string): Promise<PublicWorkshop[]> {
    const workshops = await this.workshops.find({
      ...(focusAreaId ? { where: { focusArea: { id: focusAreaId } } } : {}),
      relations: { focusArea: true },
      order: { createdAt: 'DESC' },
    });

    return workshops.map((workshop) =>
      toPublicWorkshop(workshop, this.storage),
    );
  }

  async findOne(id: string): Promise<PublicWorkshop> {
    return toPublicWorkshop(await this.findOneEntity(id), this.storage);
  }

  async create(
    input: CreateWorkshopDto,
    imageFile?: Express.Multer.File,
    pdfFile?: Express.Multer.File,
  ): Promise<PublicWorkshop> {
    const area = await this.findFocusArea(input.focusAreaId);
    const image = await this.storage.uploadImage(
      imageFile,
      WORKSHOP_IMAGE_RULE,
    );
    let pdf: UploadedPdf | undefined;

    try {
      if (pdfFile) {
        pdf = await this.storage.uploadPdf(pdfFile, PDF_RULE);
      }
    } catch (error) {
      await this.storage.delete(image.key);
      throw error;
    }

    const workshop = this.workshops.create({
      title: input.title,
      description: input.description,
      focusArea: area,
      imageKey: image.key,
      pdfKey: pdf?.key ?? null,
      pdfName: pdf ? (input.pdfName ?? pdfFile?.originalname ?? null) : null,
    });

    try {
      const saved = await this.workshops.save(workshop);
      return toPublicWorkshop(saved, this.storage);
    } catch (error) {
      await this.storage.delete(image.key);
      if (pdf) {
        await this.storage.delete(pdf.key, 'raw');
      }
      throw error;
    }
  }

  async update(
    id: string,
    input: UpdateWorkshopDto,
    imageFile?: Express.Multer.File,
    pdfFile?: Express.Multer.File,
  ): Promise<PublicWorkshop> {
    const workshop = await this.findOneEntity(id);

    if (
      input.focusAreaId !== undefined &&
      input.focusAreaId !== workshop.focusArea.id
    ) {
      workshop.focusArea = await this.findFocusArea(input.focusAreaId);
    }

    const image = imageFile
      ? await this.storage.uploadImage(imageFile, WORKSHOP_IMAGE_RULE)
      : undefined;
    let pdf: UploadedPdf | undefined;

    try {
      if (pdfFile) {
        pdf = await this.storage.uploadPdf(pdfFile, PDF_RULE);
      }
    } catch (error) {
      if (image) {
        await this.storage.delete(image.key);
      }
      throw error;
    }

    try {
      if (image) {
        await this.storage.deleteRequired(workshop.imageKey);
        workshop.imageKey = image.key;
      }
      if (pdf) {
        if (workshop.pdfKey) {
          await this.storage.deleteRequired(workshop.pdfKey, 'raw');
        }
        workshop.pdfKey = pdf.key;
        workshop.pdfName = input.pdfName ?? pdfFile?.originalname ?? null;
      }
      if (input.title !== undefined) {
        workshop.title = input.title;
      }
      if (input.description !== undefined) {
        workshop.description = input.description;
      }

      const saved = await this.workshops.save(workshop);
      return toPublicWorkshop(saved, this.storage);
    } catch (error) {
      if (image) {
        await this.storage.delete(image.key);
      }
      if (pdf) {
        await this.storage.delete(pdf.key, 'raw');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const workshop = await this.findOneEntity(id);
    await this.storage.deleteRequired(workshop.imageKey);

    if (workshop.pdfKey) {
      await this.storage.deleteRequired(workshop.pdfKey, 'raw');
    }

    const result = await this.workshops.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Taller ${id} no encontrado`);
    }
  }

  async removePdf(id: string): Promise<void> {
    const workshop = await this.findOneEntity(id);
    if (!workshop.pdfKey) {
      throw new NotFoundException(`El taller ${id} no tiene un PDF adjunto`);
    }

    await this.storage.deleteRequired(workshop.pdfKey, 'raw');
    workshop.pdfKey = null;
    workshop.pdfName = null;
    await this.workshops.save(workshop);
  }

  private async findFocusArea(id: string): Promise<FocusArea> {
    const area = await this.focusAreas.findOneBy({ id });
    if (!area) {
      throw new BadRequestException('El eje de acción indicado no existe');
    }
    return area;
  }

  private async findOneEntity(id: string): Promise<Workshop> {
    const workshop = await this.workshops.findOne({
      where: { id },
      relations: { focusArea: true },
    });
    if (!workshop) {
      throw new NotFoundException(`Taller ${id} no encontrado`);
    }
    return workshop;
  }
}

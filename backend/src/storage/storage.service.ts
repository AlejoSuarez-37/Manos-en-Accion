import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { detectImageMime } from './image-rules.js';
import {
  STORAGE_ADAPTER,
  type ImageRule,
  type StorageAdapter,
  type UploadedImage,
} from './storage.types.js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor(
    @Inject(STORAGE_ADAPTER) private readonly adapter: StorageAdapter,
  ) {}

  async uploadImage(
    file: Express.Multer.File | undefined,
    rule: ImageRule,
  ): Promise<UploadedImage> {
    if (!file) {
      throw new BadRequestException('Debe adjuntar la imagen en el campo "image"');
    }

    const mime = detectImageMime(file.buffer);
    if (!mime || !rule.allowedMimes.includes(mime)) {
      throw new UnsupportedMediaTypeException(
        'Solo se permiten imágenes JPG, PNG y WebP',
      );
    }
    if (file.size > rule.maxBytes) {
      throw new BadRequestException(
        `La imagen no debe superar ${rule.maxBytes} bytes`,
      );
    }

    try {
      return await this.adapter.upload(file, mime, rule);
    } catch {
      throw new BadGatewayException(
        'No se pudo guardar la imagen en el almacenamiento',
      );
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.tryDelete(key);
    } catch (error) {
      this.logger.error(`No se pudo eliminar la imagen ${key}`, String(error));
    }
  }

  async deleteRequired(key: string): Promise<void> {
    try {
      await this.tryDelete(key);
    } catch (error) {
      this.logger.error(`No se pudo eliminar la imagen ${key}`, String(error));
      throw new BadGatewayException(
        'No se pudo eliminar la imagen del almacenamiento',
      );
    }
  }

  private async tryDelete(key: string): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await this.adapter.delete(key);
        return;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await this.wait(attempt * 100);
        }
      }
    }

    throw lastError;
  }

  private wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  getUrl(key: string, rule: ImageRule): string {
    return this.adapter.getUrl(key, rule);
  }
}

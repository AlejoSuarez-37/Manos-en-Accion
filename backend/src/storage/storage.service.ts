import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import {
  detectImageMime,
  detectPdfMime,
  hasPdfExtension,
} from './image-rules.js';
import {
  STORAGE_ADAPTER,
  type ImageRule,
  type PdfRule,
  type StorageAdapter,
  type StoredFileType,
  type UploadedImage,
  type UploadedPdf,
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

  async uploadPdf(
    file: Express.Multer.File | undefined,
    rule: PdfRule,
  ): Promise<UploadedPdf> {
    if (!file) {
      throw new BadRequestException('Debe adjuntar el PDF en el campo "pdf"');
    }

    const mime = detectPdfMime(file.buffer);
    if (!mime || !rule.allowedMimes.includes(mime)) {
      throw new UnsupportedMediaTypeException('Solo se permiten archivos PDF');
    }
    if (!hasPdfExtension(file.originalname)) {
      throw new BadRequestException('El archivo debe tener extensión .pdf');
    }
    if (file.size > rule.maxBytes) {
      throw new BadRequestException(
        `El PDF no debe superar ${rule.maxBytes} bytes`,
      );
    }

    try {
      return await this.adapter.uploadPdf(file, mime, rule);
    } catch {
      throw new BadGatewayException(
        'No se pudo guardar el PDF en el almacenamiento',
      );
    }
  }

  async delete(
    key: string,
    resourceType: StoredFileType = 'image',
  ): Promise<void> {
    try {
      await this.tryDelete(key, resourceType);
    } catch (error) {
      this.logger.error(`No se pudo eliminar el archivo ${key}`, String(error));
    }
  }

  async deleteRequired(
    key: string,
    resourceType: StoredFileType = 'image',
  ): Promise<void> {
    try {
      await this.tryDelete(key, resourceType);
    } catch (error) {
      this.logger.error(`No se pudo eliminar el archivo ${key}`, String(error));
      throw new BadGatewayException(
        'No se pudo eliminar el archivo del almacenamiento',
      );
    }
  }

  private async tryDelete(
    key: string,
    resourceType: StoredFileType,
  ): Promise<void> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        await this.adapter.delete(key, resourceType);
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

  getPdfUrl(key: string, rule: PdfRule, name?: string): string {
    return this.adapter.getPdfUrl(key, rule, name);
  }
}

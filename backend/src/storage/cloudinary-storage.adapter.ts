import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { buildPublicId, sanitizeFileName } from './image-rules.js';
import type {
  ImageRule,
  PdfRule,
  StorageAdapter,
  StoredFileType,
  UploadedImage,
  UploadedPdf,
} from './storage.types.js';

@Injectable()
export class CloudinaryStorageAdapter implements StorageAdapter {
  constructor(config: ConfigService) {
    cloudinary.config({
      cloud_name: config.get<string>('CLOUDINARY_CLOUD_NAME') ?? '',
      api_key: config.get<string>('CLOUDINARY_API_KEY') ?? '',
      api_secret: config.get<string>('CLOUDINARY_API_SECRET') ?? '',
      secure: true,
    });
  }

  async upload(
    file: Express.Multer.File,
    mime: string,
    rule: ImageRule,
  ): Promise<UploadedImage> {
    const result = await cloudinary.uploader.upload(
      `data:${mime};base64,${file.buffer.toString('base64')}`,
      {
        public_id: buildPublicId(rule, file.originalname),
        resource_type: 'image',
        overwrite: false,
      },
    );
    return { key: result.public_id, url: this.getUrl(result.public_id, rule) };
  }

  async uploadPdf(
    file: Express.Multer.File,
    mime: string,
    rule: PdfRule,
  ): Promise<UploadedPdf> {
    const result = await cloudinary.uploader.upload(
      `data:${mime};base64,${file.buffer.toString('base64')}`,
      {
        public_id: buildPublicId(rule, file.originalname),
        resource_type: 'raw',
        overwrite: false,
      },
    );
    return {
      key: result.public_id,
      url: this.getPdfUrl(result.public_id, rule),
    };
  }

  getUrl(key: string, rule: ImageRule): string {
    return cloudinary.url(key, {
      secure: true,
      resource_type: 'image',
      transformation: [
        {
          width: rule.width,
          height: rule.height,
          crop: 'fill',
          gravity: 'face',
        },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  getPdfUrl(key: string, rule: PdfRule, name?: string): string {
    return cloudinary.url(key, {
      secure: true,
      resource_type: 'raw',
      flags: name ? `attachment:${sanitizeFileName(name)}` : 'attachment',
    });
  }

  async delete(
    key: string,
    resourceType: StoredFileType = 'image',
  ): Promise<void> {
    const result = await cloudinary.uploader.destroy(key, {
      resource_type: resourceType,
      invalidate: true,
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary no pudo eliminar ${key}: ${result.result}`);
    }
  }
}

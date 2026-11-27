import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { buildPublicId } from './image-rules.js';
import type {
  ImageRule,
  StorageAdapter,
  UploadedImage,
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

  getUrl(key: string, rule: ImageRule): string {
    return cloudinary.url(key, {
      secure: true,
      resource_type: 'image',
      transformation: [
        {
          width: rule.width,
          height: rule.height,
          crop: rule.crop,
          ...(rule.gravity ? { gravity: rule.gravity } : {}),
        },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  async delete(key: string): Promise<void> {
    const result = await cloudinary.uploader.destroy(key, {
      resource_type: 'image',
      invalidate: true,
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary no pudo eliminar ${key}: ${result.result}`);
    }
  }
}

export type ImageCrop = 'fill' | 'fit' | 'limit' | 'pad';

export interface ImageRule {
  allowedMimes: readonly string[];
  maxBytes: number;
  width: number;
  height: number;
  folder: string;
  crop?: ImageCrop;
  gravity?: 'face' | 'center';
}

export interface UploadedImage {
  key: string;
  url: string;
}

export interface StorageAdapter {
  upload(
    file: Express.Multer.File,
    mime: string,
    rule: ImageRule,
  ): Promise<UploadedImage>;
  delete(key: string): Promise<void>;
  getUrl(key: string, rule: ImageRule): string;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

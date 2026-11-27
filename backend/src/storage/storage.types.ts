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

export interface PdfRule {
  allowedMimes: readonly string[];
  maxBytes: number;
  folder: string;
}

export interface UploadedImage {
  key: string;
  url: string;
}

export interface UploadedPdf {
  key: string;
  url: string;
}

export type StoredFileType = 'image' | 'raw';

export interface StorageAdapter {
  upload(
    file: Express.Multer.File,
    mime: string,
    rule: ImageRule,
  ): Promise<UploadedImage>;
  uploadPdf(
    file: Express.Multer.File,
    mime: string,
    rule: PdfRule,
  ): Promise<UploadedPdf>;
  delete(key: string, resourceType?: StoredFileType): Promise<void>;
  getUrl(key: string, rule: ImageRule): string;
  getPdfUrl(key: string, rule: PdfRule, name?: string): string;
}

export const STORAGE_ADAPTER = Symbol('STORAGE_ADAPTER');

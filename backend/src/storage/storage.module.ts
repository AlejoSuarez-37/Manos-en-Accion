import { Module } from '@nestjs/common';
import { CloudinaryStorageAdapter } from './cloudinary-storage.adapter.js';
import { StorageService } from './storage.service.js';
import { STORAGE_ADAPTER } from './storage.types.js';

@Module({
  providers: [
    StorageService,
    { provide: STORAGE_ADAPTER, useClass: CloudinaryStorageAdapter },
  ],
  exports: [StorageService],
})
export class StorageModule {}

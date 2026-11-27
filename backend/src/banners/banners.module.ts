import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module.js';
import { Banner } from './entities/banner.entity.js';
import { BannersController } from './banners.controller.js';
import { BannersService } from './banners.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Banner]), StorageModule],
    controllers: [BannersController],
    providers: [BannersService],
    exports: [TypeOrmModule, BannersService],
})
export class BannersModule { }

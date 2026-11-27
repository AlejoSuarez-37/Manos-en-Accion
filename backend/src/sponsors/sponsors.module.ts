import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module.js';
import { Sponsor } from './entities/sponsor.entity.js';
import { SponsorsController } from './sponsors.controller.js';
import { SponsorsService } from './sponsors.service.js';

@Module({
    imports: [TypeOrmModule.forFeature([Sponsor]), StorageModule],
    controllers: [SponsorsController],
    providers: [SponsorsService],
    exports: [TypeOrmModule, SponsorsService],
})
export class SponsorsModule { }
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../storage/storage.module.js';
import { FocusArea } from './entities/focus-area.entity.js';
import { Workshop } from './entities/workshop.entity.js';
import { FocusAreasController } from './focus-areas.controller.js';
import { FocusAreasService } from './focus-areas.service.js';
import { WorkshopsController } from './workshops.controller.js';
import { WorkshopsService } from './workshops.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([FocusArea, Workshop]), StorageModule],
  controllers: [FocusAreasController, WorkshopsController],
  providers: [FocusAreasService, WorkshopsService],
  exports: [TypeOrmModule, FocusAreasService, WorkshopsService],
})
export class WorkshopsModule {}

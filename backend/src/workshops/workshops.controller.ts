import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ContentPolicy } from '../authorization/content.policy.js';
import {
  createWorkshopSchema,
  listWorkshopsQuerySchema,
  updateWorkshopSchema,
  workshopIdParamSchema,
  type CreateWorkshopDto,
  type ListWorkshopsQueryDto,
  type UpdateWorkshopDto,
} from '../schemas/workshops.schemas.js';
import {
  ApiCreateWorkshop,
  ApiDeleteWorkshop,
  ApiDeleteWorkshopPdf,
  ApiFindWorkshops,
  ApiFindOneWorkshop,
  ApiUpdateWorkshop,
} from './decorators/workshops-swagger.decorator.js';
import { WorkshopsService } from './workshops.service.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

interface WorkshopFiles {
  image?: Express.Multer.File[];
  pdf?: Express.Multer.File[];
}

const workshopUpload = () =>
  UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'pdf', maxCount: 1 },
      ],
      { limits: { fileSize: MAX_UPLOAD_BYTES } },
    ),
  );

@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  @Public()
  @ApiFindWorkshops()
  findAll(
    @Query({ schema: listWorkshopsQuerySchema }) query: ListWorkshopsQueryDto,
  ) {
    return this.workshopsService.findAll(query.focusAreaId);
  }

  @Get(':id')
  @Public()
  @ApiFindOneWorkshop()
  findOne(@Param('id', { schema: workshopIdParamSchema }) id: string) {
    return this.workshopsService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @workshopUpload()
  @ApiCreateWorkshop()
  @Can(ContentPolicy, 'manage')
  create(
    @Body({ schema: createWorkshopSchema }) input: CreateWorkshopDto,
    @UploadedFiles() files?: WorkshopFiles,
  ) {
    return this.workshopsService.create(
      input,
      files?.image?.[0],
      files?.pdf?.[0],
    );
  }

  @Patch(':id')
  @workshopUpload()
  @ApiUpdateWorkshop()
  @Can(ContentPolicy, 'manage')
  update(
    @Param('id', { schema: workshopIdParamSchema }) id: string,
    @Body({ schema: updateWorkshopSchema }) input: UpdateWorkshopDto,
    @UploadedFiles() files?: WorkshopFiles,
  ) {
    return this.workshopsService.update(
      id,
      input,
      files?.image?.[0],
      files?.pdf?.[0],
    );
  }

  @Delete(':id/pdf')
  @HttpCode(204)
  @ApiDeleteWorkshopPdf()
  @Can(ContentPolicy, 'manage')
  async removePdf(
    @Param('id', { schema: workshopIdParamSchema }) id: string,
  ): Promise<void> {
    await this.workshopsService.removePdf(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiDeleteWorkshop()
  @Can(ContentPolicy, 'manage')
  async remove(
    @Param('id', { schema: workshopIdParamSchema }) id: string,
  ): Promise<void> {
    await this.workshopsService.remove(id);
  }
}

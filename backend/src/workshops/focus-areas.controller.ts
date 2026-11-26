import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ContentPolicy } from '../authorization/content.policy.js';
import {
  createFocusAreaSchema,
  focusAreaIdParamSchema,
  updateFocusAreaSchema,
  type CreateFocusAreaDto,
  type UpdateFocusAreaDto,
} from '../schemas/workshops.schemas.js';
import {
  ApiCreateFocusArea,
  ApiDeleteFocusArea,
  ApiFindFocusAreas,
  ApiFindOneFocusArea,
  ApiUpdateFocusArea,
} from './decorators/focus-areas-swagger.decorator.js';
import { FocusAreasService } from './focus-areas.service.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const imageUpload = () =>
  UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
    }),
  );

@Controller('focus-areas')
export class FocusAreasController {
  constructor(private readonly focusAreasService: FocusAreasService) {}

  @Get()
  @Public()
  @ApiFindFocusAreas()
  findAll() {
    return this.focusAreasService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiFindOneFocusArea()
  findOne(@Param('id', { schema: focusAreaIdParamSchema }) id: string) {
    return this.focusAreasService.findOne(id);
  }

  @Post()
  @HttpCode(201)
  @imageUpload()
  @ApiCreateFocusArea()
  @Can(ContentPolicy, 'manage')
  create(
    @Body({ schema: createFocusAreaSchema }) input: CreateFocusAreaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.focusAreasService.create(input, file);
  }

  @Patch(':id')
  @imageUpload()
  @ApiUpdateFocusArea()
  @Can(ContentPolicy, 'manage')
  update(
    @Param('id', { schema: focusAreaIdParamSchema }) id: string,
    @Body({ schema: updateFocusAreaSchema }) input: UpdateFocusAreaDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.focusAreasService.update(id, input, file);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiDeleteFocusArea()
  @Can(ContentPolicy, 'manage')
  async remove(
    @Param('id', { schema: focusAreaIdParamSchema }) id: string,
  ): Promise<void> {
    await this.focusAreasService.remove(id);
  }
}

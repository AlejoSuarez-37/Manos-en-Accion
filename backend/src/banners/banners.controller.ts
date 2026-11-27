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
    bannerIdParamSchema,
    updateBannerSchema,
    type UpdateBannerDto,
} from '../schemas/banners.schemas.js';
import {
    ApiCreateBanner,
    ApiDeleteBanner,
    ApiFindBanners,
    ApiFindOneBanner,
    ApiUpdateBanner,
} from './decorators/banners-swagger.decorator.js';
import { BannersService } from './banners.service.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const imageUpload = () =>
    UseInterceptors(
        FileInterceptor('image', {
            limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
        }),
    );

@Controller('banners')
export class BannersController {
    constructor(private readonly bannersService: BannersService) { }

    @Get()
    @Public()
    @ApiFindBanners()
    findAll() {
        return this.bannersService.findAll();
    }

    @Get(':id')
    @ApiFindOneBanner()
    @Can(ContentPolicy, 'manage')
    findOne(@Param('id', { schema: bannerIdParamSchema }) id: string) {
        return this.bannersService.findOne(id);
    }

    @Post()
    @HttpCode(201)
    @imageUpload()
    @ApiCreateBanner()
    @Can(ContentPolicy, 'manage')
    create(@UploadedFile() file?: Express.Multer.File) {
        return this.bannersService.create(file);
    }

    @Patch(':id')
    @imageUpload()
    @ApiUpdateBanner()
    @Can(ContentPolicy, 'manage')
    update(
        @Param('id', { schema: bannerIdParamSchema }) id: string,
        @Body({ schema: updateBannerSchema }) input: UpdateBannerDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.bannersService.update(id, input, file);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiDeleteBanner()
    @Can(ContentPolicy, 'manage')
    async remove(
        @Param('id', { schema: bannerIdParamSchema }) id: string,
    ): Promise<void> {
        await this.bannersService.remove(id);
    }
}

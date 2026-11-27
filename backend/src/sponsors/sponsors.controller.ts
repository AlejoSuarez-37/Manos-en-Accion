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
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Public } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { ContentPolicy } from '../authorization/content.policy.js';
import {
    createSponsorSchema,
    listSponsorsQuerySchema,
    sponsorIdParamSchema,
    updateSponsorSchema,
    type CreateSponsorDto,
    type ListSponsorsQueryDto,
    type UpdateSponsorDto,
} from '../schemas/sponsors.schemas.js';
import {
    ApiCreateSponsor,
    ApiDeleteSponsor,
    ApiFindOneSponsor,
    ApiFindSponsors,
    ApiUpdateSponsor,
} from './decorators/sponsors-swagger.decorator.js';
import { SponsorsService } from './sponsors.service.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const imageUpload = () =>
    UseInterceptors(
        FileInterceptor('image', {
            limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
        }),
    );

@Controller('sponsors')
export class SponsorsController {
    constructor(private readonly sponsorsService: SponsorsService) { }

    @Get()
    @Public()
    @ApiFindSponsors()
    findAll(
        @Query({ schema: listSponsorsQuerySchema }) query: ListSponsorsQueryDto,
    ) {
        return this.sponsorsService.findAll(query);
    }

    @Get(':id')
    @ApiFindOneSponsor()
    @Can(ContentPolicy, 'manage')
    findOne(@Param('id', { schema: sponsorIdParamSchema }) id: string) {
        return this.sponsorsService.findOne(id);
    }

    @Post()
    @HttpCode(201)
    @imageUpload()
    @ApiCreateSponsor()
    @Can(ContentPolicy, 'manage')
    create(
        @Body({ schema: createSponsorSchema }) input: CreateSponsorDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.sponsorsService.create(input, file);
    }

    @Patch(':id')
    @imageUpload()
    @ApiUpdateSponsor()
    @Can(ContentPolicy, 'manage')
    update(
        @Param('id', { schema: sponsorIdParamSchema }) id: string,
        @Body({ schema: updateSponsorSchema }) input: UpdateSponsorDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.sponsorsService.update(id, input, file);
    }

    @Delete(':id')
    @HttpCode(204)
    @ApiDeleteSponsor()
    @Can(ContentPolicy, 'manage')
    async remove(
        @Param('id', { schema: sponsorIdParamSchema }) id: string,
    ): Promise<void> {
        await this.sponsorsService.remove(id);
    }
}
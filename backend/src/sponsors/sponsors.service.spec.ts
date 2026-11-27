import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SPONSOR_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import { Sponsor } from './entities/sponsor.entity.js';
import { SponsorsService } from './sponsors.service.js';

const PNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const archivo = () =>
    ({
        buffer: PNG,
        size: PNG.length,
        originalname: 'logo.png',
    }) as unknown as Express.Multer.File;

const sponsor = (overrides: Partial<Sponsor> = {}): Sponsor =>
    ({
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Marca',
        category: 'corporate_support',
        websiteUrl: 'https://marca.org',
        imageKey: 'sponsors/marca.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as Sponsor;

describe('SponsorsService', () => {
    let sponsors: {
        create: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
        find: ReturnType<typeof vi.fn>;
        findOneBy: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
    };
    let storage: {
        uploadImage: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        deleteRequired: ReturnType<typeof vi.fn>;
        getUrl: ReturnType<typeof vi.fn>;
    };
    let service: SponsorsService;

    beforeEach(() => {
        sponsors = {
            create: vi.fn((input) => input),
            save: vi.fn(async (input) => input),
            find: vi.fn().mockResolvedValue([]),
            findOneBy: vi.fn().mockResolvedValue(null),
            delete: vi.fn().mockResolvedValue({ affected: 1 }),
        };
        storage = {
            uploadImage: vi
                .fn()
                .mockResolvedValue({ key: 'sponsors/nuevo.png', url: 'https://cdn/nuevo' }),
            delete: vi.fn().mockResolvedValue(undefined),
            deleteRequired: vi.fn().mockResolvedValue(undefined),
            getUrl: vi.fn((key: string) => `https://cdn/${key}`),
        };
        service = new SponsorsService(
            sponsors as unknown as Repository<Sponsor>,
            storage as unknown as StorageService,
        );
    });

    it('sube el logo al crear y guarda la clave y el websiteUrl', async () => {
        const resultado = await service.create(
            {
                name: 'Marca',
                category: 'corporate_support',
                websiteUrl: 'https://marca.org',
            },
            archivo(),
        );

        expect(storage.uploadImage).toHaveBeenCalledWith(
            expect.any(Object),
            SPONSOR_IMAGE_RULE,
        );
        expect(sponsors.create).toHaveBeenCalledWith({
            name: 'Marca',
            category: 'corporate_support',
            websiteUrl: 'https://marca.org',
            imageKey: 'sponsors/nuevo.png',
        });
        expect(resultado).toMatchObject({
            websiteUrl: 'https://marca.org',
            imageUrl: 'https://cdn/sponsors/nuevo.png',
        });
        expect(resultado).not.toHaveProperty('imageKey');
    });

    it('guarda websiteUrl en null cuando no se envía', async () => {
        await service.create(
            { name: 'Marca', category: 'friend_organizations' },
            archivo(),
        );

        expect(sponsors.create).toHaveBeenCalledWith(
            expect.objectContaining({ websiteUrl: null }),
        );
    });

    it('limpia el logo subido si falla el guardado', async () => {
        sponsors.save.mockRejectedValue(new Error('falló la base'));

        await expect(
            service.create(
                { name: 'Marca', category: 'corporate_support' },
                archivo(),
            ),
        ).rejects.toThrow('falló la base');
        expect(storage.delete).toHaveBeenCalledWith('sponsors/nuevo.png');
    });

    it('actualiza datos, categoría, websiteUrl y logo, y borra el anterior antes de guardar', async () => {
        sponsors.findOneBy.mockResolvedValue(sponsor());

        const resultado = await service.update(
            '11111111-1111-1111-1111-111111111111',
            {
                name: 'Marca Nueva',
                category: 'friend_organizations',
                websiteUrl: 'https://nueva.org',
            },
            archivo(),
        );

        expect(storage.uploadImage).toHaveBeenCalled();
        expect(storage.deleteRequired).toHaveBeenCalledWith('sponsors/marca.png');
        expect(storage.deleteRequired.mock.invocationCallOrder[0]).toBeLessThan(
            sponsors.save.mock.invocationCallOrder[0],
        );
        expect(sponsors.save).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Marca Nueva',
                category: 'friend_organizations',
                websiteUrl: 'https://nueva.org',
                imageKey: 'sponsors/nuevo.png',
            }),
        );
        expect(resultado.websiteUrl).toBe('https://nueva.org');
    });

    it('limpia el websiteUrl sin tocar el logo cuando llega null', async () => {
        sponsors.findOneBy.mockResolvedValue(sponsor());

        const resultado = await service.update(
            '11111111-1111-1111-1111-111111111111',
            { websiteUrl: null },
        );

        expect(storage.uploadImage).not.toHaveBeenCalled();
        expect(storage.deleteRequired).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
        expect(sponsors.save).toHaveBeenCalledWith(
            expect.objectContaining({
                websiteUrl: null,
                imageKey: 'sponsors/marca.png',
            }),
        );
        expect(resultado.websiteUrl).toBeNull();
    });

    it('no toca imágenes en una actualización sin foto', async () => {
        sponsors.findOneBy.mockResolvedValue(sponsor());

        await service.update('11111111-1111-1111-1111-111111111111', {
            name: 'Solo nombre',
        });

        expect(storage.uploadImage).not.toHaveBeenCalled();
        expect(storage.deleteRequired).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it('actualiza solo el logo cuando no vienen campos en el body', async () => {
        sponsors.findOneBy.mockResolvedValue(sponsor());

        const resultado = await service.update(
            '11111111-1111-1111-1111-111111111111',
            {},
            archivo(),
        );

        expect(storage.uploadImage).toHaveBeenCalled();
        expect(storage.deleteRequired).toHaveBeenCalledWith('sponsors/marca.png');
        expect(sponsors.save).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Marca',
                imageKey: 'sponsors/nuevo.png',
            }),
        );
        expect(resultado.imageUrl).toBe('https://cdn/sponsors/nuevo.png');
    });

    it('rechaza un PATCH sin campos ni imagen', async () => {
        await expect(
            service.update('11111111-1111-1111-1111-111111111111', {}),
        ).rejects.toThrow('Debe enviar al menos un campo o una imagen');
        expect(sponsors.findOneBy).not.toHaveBeenCalled();
    });

    it('no guarda ni deja la imagen nueva si falla el borrado de la anterior', async () => {
        sponsors.findOneBy.mockResolvedValue(sponsor());
        storage.deleteRequired.mockRejectedValue(new Error('Cloudinary caído'));

        await expect(
            service.update(
                '11111111-1111-1111-1111-111111111111',
                { name: 'Marca Nueva' },
                archivo(),
            ),
        ).rejects.toThrow('Cloudinary caído');

        expect(sponsors.save).not.toHaveBeenCalled();
        expect(storage.delete).toHaveBeenCalledWith('sponsors/nuevo.png');
    });

    it('elimina la fila y el logo en un DELETE', async () => {
        sponsors.findOneBy.mockResolvedValue(sponsor());

        await service.remove('11111111-1111-1111-1111-111111111111');

        expect(storage.deleteRequired).toHaveBeenCalledWith('sponsors/marca.png');
        expect(storage.deleteRequired.mock.invocationCallOrder[0]).toBeLessThan(
            sponsors.delete.mock.invocationCallOrder[0],
        );
        expect(sponsors.delete).toHaveBeenCalledWith({
            id: '11111111-1111-1111-1111-111111111111',
        });
        expect(sponsors.save).not.toHaveBeenCalled();
    });

    it('no borra la fila si falla Cloudinary', async () => {
        sponsors.findOneBy.mockResolvedValue(sponsor());
        storage.deleteRequired.mockRejectedValue(new Error('Cloudinary caído'));

        await expect(
            service.remove('11111111-1111-1111-1111-111111111111'),
        ).rejects.toThrow('Cloudinary caído');
        expect(sponsors.delete).not.toHaveBeenCalled();
    });

    it('lista todos los sponsors en la vista pública', async () => {
        sponsors.find.mockResolvedValue([sponsor()]);

        const resultado = await service.findAll();

        expect(sponsors.find).toHaveBeenCalledWith({
            where: {},
            order: { createdAt: 'DESC' },
        });
        expect(resultado[0]).toEqual(
            expect.objectContaining({
                websiteUrl: 'https://marca.org',
                imageUrl: 'https://cdn/sponsors/marca.png',
            }),
        );
        expect(resultado[0]).not.toHaveProperty('imageKey');
    });

    it('filtra por categoría cuando se envió el query param', async () => {
        await service.findAll({ category: 'corporate_support' });

        expect(sponsors.find).toHaveBeenCalledWith({
            where: { category: 'corporate_support' },
            order: { createdAt: 'DESC' },
        });
    });

    it('falla con 404 si el sponsor no existe', async () => {
        await expect(service.findOne('no-existe')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });
});
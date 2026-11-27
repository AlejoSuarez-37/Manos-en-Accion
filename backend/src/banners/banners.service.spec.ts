import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { BANNER_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import { Banner } from './entities/banner.entity.js';
import { BannersService } from './banners.service.js';

const PNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const archivo = () =>
    ({
        buffer: PNG,
        size: PNG.length,
        originalname: 'banner.png',
    }) as unknown as Express.Multer.File;

const banner = (overrides: Partial<Banner> = {}): Banner =>
    ({
        id: '11111111-1111-1111-1111-111111111111',
        position: 1,
        imageKey: 'banners/actual.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...overrides,
    }) as Banner;

describe('BannersService', () => {
    let banners: {
        create: ReturnType<typeof vi.fn>;
        save: ReturnType<typeof vi.fn>;
        find: ReturnType<typeof vi.fn>;
        findOneBy: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        createQueryBuilder: ReturnType<typeof vi.fn>;
    };
    let updateBuilder: {
        update: ReturnType<typeof vi.fn>;
        set: ReturnType<typeof vi.fn>;
        where: ReturnType<typeof vi.fn>;
        execute: ReturnType<typeof vi.fn>;
    };
    let storage: {
        uploadImage: ReturnType<typeof vi.fn>;
        delete: ReturnType<typeof vi.fn>;
        deleteRequired: ReturnType<typeof vi.fn>;
        getUrl: ReturnType<typeof vi.fn>;
    };
    let service: BannersService;

    beforeEach(() => {
        updateBuilder = {
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            execute: vi.fn().mockResolvedValue({ affected: 1, raw: [] }),
        };
        banners = {
            create: vi.fn((input) => input),
            save: vi.fn(async (input) => ({
                id: '11111111-1111-1111-1111-111111111111',
                ...input,
            })),
            find: vi.fn().mockResolvedValue([]),
            findOneBy: vi.fn().mockResolvedValue(null),
            delete: vi.fn().mockResolvedValue({ affected: 1 }),
            createQueryBuilder: vi.fn(() => updateBuilder),
        };
        storage = {
            uploadImage: vi
                .fn()
                .mockResolvedValue({ key: 'banners/nuevo.png', url: 'https://cdn/nuevo' }),
            delete: vi.fn().mockResolvedValue(undefined),
            deleteRequired: vi.fn().mockResolvedValue(undefined),
            getUrl: vi.fn((key: string) => `https://cdn/${key}`),
        };
        service = new BannersService(
            banners as unknown as Repository<Banner>,
            storage as unknown as StorageService,
        );
    });

    it('sube el banner al crear y asigna la última posición', async () => {
        banners.find.mockResolvedValue([banner({ position: 3 })]);

        const resultado = await service.create(archivo());

        expect(banners.find).toHaveBeenCalledWith({
            order: { position: 'DESC' },
            take: 1,
        });
        expect(storage.uploadImage).toHaveBeenCalledWith(
            expect.any(Object),
            BANNER_IMAGE_RULE,
        );
        expect(banners.create).toHaveBeenCalledWith({
            position: 4,
            imageKey: 'banners/nuevo.png',
        });
        expect(resultado).toEqual({
            id: '11111111-1111-1111-1111-111111111111',
            position: 4,
            imageUrl: 'https://cdn/banners/nuevo.png',
        });
        expect(resultado).not.toHaveProperty('imageKey');
    });

    it('empieza en la posición 1 cuando no hay banners', async () => {
        await service.create(archivo());

        expect(banners.create).toHaveBeenCalledWith({
            position: 1,
            imageKey: 'banners/nuevo.png',
        });
    });

    it('limpia la imagen subida si falla el guardado', async () => {
        banners.save.mockRejectedValue(new Error('falló la base'));

        await expect(service.create(archivo())).rejects.toThrow('falló la base');
        expect(storage.delete).toHaveBeenCalledWith('banners/nuevo.png');
    });

    it('actualiza solo la posición sin tocar la imagen', async () => {
        banners.findOneBy.mockResolvedValue(banner());

        const resultado = await service.update(
            '11111111-1111-1111-1111-111111111111',
            { position: 5 },
        );

        expect(storage.uploadImage).not.toHaveBeenCalled();
        expect(storage.deleteRequired).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
        expect(banners.save).toHaveBeenCalledWith(
            expect.objectContaining({ position: 5, imageKey: 'banners/actual.png' }),
        );
        expect(resultado.position).toBe(5);
    });

    it('reemplaza la imagen sin campos en el body y conserva la posición', async () => {
        banners.findOneBy.mockResolvedValue(banner({ position: 7 }));

        const resultado = await service.update(
            '11111111-1111-1111-1111-111111111111',
            {},
            archivo(),
        );

        expect(storage.uploadImage).toHaveBeenCalledWith(
            expect.any(Object),
            BANNER_IMAGE_RULE,
        );
        expect(storage.deleteRequired).toHaveBeenCalledWith('banners/actual.png');
        expect(storage.deleteRequired.mock.invocationCallOrder[0]).toBeLessThan(
            banners.save.mock.invocationCallOrder[0],
        );
        expect(banners.save).toHaveBeenCalledWith(
            expect.objectContaining({ position: 7, imageKey: 'banners/nuevo.png' }),
        );
        expect(resultado.imageUrl).toBe('https://cdn/banners/nuevo.png');
    });

    it('rechaza un PATCH sin posición ni imagen', async () => {
        await expect(
            service.update('11111111-1111-1111-1111-111111111111', {}),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(banners.findOneBy).not.toHaveBeenCalled();
    });

    it('no guarda ni deja la imagen nueva si falla el borrado de la anterior', async () => {
        banners.findOneBy.mockResolvedValue(banner());
        storage.deleteRequired.mockRejectedValue(new Error('Cloudinary caído'));

        await expect(
            service.update(
                '11111111-1111-1111-1111-111111111111',
                { position: 2 },
                archivo(),
            ),
        ).rejects.toThrow('Cloudinary caído');

        expect(banners.save).not.toHaveBeenCalled();
        expect(storage.delete).toHaveBeenCalledWith('banners/nuevo.png');
    });

    it('elimina la fila y la imagen en un DELETE', async () => {
        banners.findOneBy.mockResolvedValue(banner());

        await service.remove('11111111-1111-1111-1111-111111111111');

        expect(storage.deleteRequired).toHaveBeenCalledWith('banners/actual.png');
        expect(storage.deleteRequired.mock.invocationCallOrder[0]).toBeLessThan(
            banners.delete.mock.invocationCallOrder[0],
        );
        expect(banners.delete).toHaveBeenCalledWith({
            id: '11111111-1111-1111-1111-111111111111',
        });
        expect(banners.save).not.toHaveBeenCalled();
    });

    it('decrementa en 1 las posiciones posteriores al banner eliminado', async () => {
        banners.findOneBy.mockResolvedValue(banner({ position: 2 }));

        await service.remove('11111111-1111-1111-1111-111111111111');

        expect(banners.createQueryBuilder).toHaveBeenCalledTimes(1);
        expect(updateBuilder.update).toHaveBeenCalledWith(Banner);
        expect(updateBuilder.set).toHaveBeenCalledWith({
            position: expect.any(Function),
        });
        const values = updateBuilder.set.mock.calls[0][0] as {
            position: () => string;
        };
        expect(values.position()).toBe('position - 1');
        expect(updateBuilder.where).toHaveBeenCalledWith(
            'position > :deletedPosition',
            { deletedPosition: 2 },
        );
        expect(updateBuilder.execute.mock.invocationCallOrder[0]).toBeGreaterThan(
            banners.delete.mock.invocationCallOrder[0],
        );
    });

    it('no reordena si la fila ya no existía al borrar', async () => {
        banners.findOneBy.mockResolvedValue(banner());
        banners.delete.mockResolvedValue({ affected: 0 });

        await expect(
            service.remove('11111111-1111-1111-1111-111111111111'),
        ).rejects.toBeInstanceOf(NotFoundException);
        expect(banners.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('no borra la fila si falla Cloudinary', async () => {
        banners.findOneBy.mockResolvedValue(banner());
        storage.deleteRequired.mockRejectedValue(new Error('Cloudinary caído'));

        await expect(
            service.remove('11111111-1111-1111-1111-111111111111'),
        ).rejects.toThrow('Cloudinary caído');
        expect(banners.delete).not.toHaveBeenCalled();
        expect(banners.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('lista los banners públicos ordenados por posición', async () => {
        banners.find.mockResolvedValue([
            banner({ id: 'primero', position: 1 }),
            banner({ id: 'segundo', position: 2 }),
        ]);

        const resultado = await service.findAll();

        expect(banners.find).toHaveBeenCalledWith({
            order: { position: 'ASC', createdAt: 'ASC' },
        });
        expect(resultado.map((item) => item.position)).toEqual([1, 2]);
        expect(resultado[0]).toEqual({
            id: 'primero',
            position: 1,
            imageUrl: 'https://cdn/banners/actual.png',
        });
        expect(resultado[0]).not.toHaveProperty('imageKey');
    });

    it('falla con 404 si el banner no existe', async () => {
        await expect(service.findOne('no-existe')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });
});

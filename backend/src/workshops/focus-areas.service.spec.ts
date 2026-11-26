import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { StorageService } from '../storage/storage.service.js';
import { FocusArea } from './entities/focus-area.entity.js';
import { Workshop } from './entities/workshop.entity.js';
import { FocusAreasService } from './focus-areas.service.js';

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const archivo = () =>
  ({
    buffer: PNG,
    size: PNG.length,
    originalname: 'eje.png',
  }) as unknown as Express.Multer.File;

const area = (overrides: Partial<FocusArea> = {}): FocusArea =>
  ({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Proyectos Productivos',
    description: 'Emprendimientos comunitarios',
    imageKey: 'focus-areas/eje-anterior.png',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as FocusArea;

const taller = (): Workshop =>
  ({
    id: '22222222-2222-2222-2222-222222222222',
    title: 'Gastronomía con Propósito',
    description: 'Taller de cocina solidaria',
    imageKey: 'workshops/taller.png',
    pdfKey: null,
    pdfName: null,
    focusArea: area(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as Workshop;

describe('FocusAreasService', () => {
  let focusAreas: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOneBy: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  let workshops: {
    find: ReturnType<typeof vi.fn>;
    count: ReturnType<typeof vi.fn>;
  };
  let storage: {
    uploadImage: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteRequired: ReturnType<typeof vi.fn>;
    getUrl: ReturnType<typeof vi.fn>;
  };
  let service: FocusAreasService;

  beforeEach(() => {
    focusAreas = {
      create: vi.fn((input) => input),
      save: vi.fn(async (input) => input),
      find: vi.fn().mockResolvedValue([]),
      findOneBy: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
      count: vi.fn().mockResolvedValue(0),
    };
    workshops = {
      find: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
    };
    storage = {
      uploadImage: vi
        .fn()
        .mockResolvedValue({
          key: 'focus-areas/nuevo.png',
          url: 'https://cdn/nuevo',
        }),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteRequired: vi.fn().mockResolvedValue(undefined),
      getUrl: vi.fn((key: string) => `https://cdn/${key}`),
    };
    service = new FocusAreasService(
      focusAreas as unknown as Repository<FocusArea>,
      workshops as unknown as Repository<Workshop>,
      storage as unknown as StorageService,
    );
  });

  it('agrupa los talleres por eje en el listado público', async () => {
    focusAreas.find.mockResolvedValue([area()]);
    workshops.find.mockResolvedValue([taller()]);

    const resultado = await service.findAll();

    expect(resultado).toHaveLength(1);
    expect(resultado[0].workshops).toHaveLength(1);
    expect(resultado[0].imageUrl).toContain('focus-areas/eje-anterior.png');
    expect(resultado[0].workshops[0].imageUrl).toContain(
      'workshops/taller.png',
    );
    expect(resultado[0]).not.toHaveProperty('imageKey');
  });

  it('sube la imagen al crear y guarda solo la clave', async () => {
    const resultado = await service.create(
      { name: 'Voluntariados', description: undefined },
      archivo(),
    );

    expect(focusAreas.save).toHaveBeenCalledWith(
      expect.objectContaining({ imageKey: 'focus-areas/nuevo.png' }),
    );
    expect(resultado.description).toBeNull();
    expect(resultado.workshops).toEqual([]);
  });

  it('limpia la imagen si falla el guardado al crear', async () => {
    focusAreas.save.mockRejectedValueOnce(new Error('DB caída'));

    await expect(
      service.create(
        { name: 'Voluntariados', description: undefined },
        archivo(),
      ),
    ).rejects.toThrow('DB caída');
    expect(storage.delete).toHaveBeenCalledWith('focus-areas/nuevo.png');
  });

  it('reemplaza la imagen al actualizar', async () => {
    focusAreas.findOneBy.mockResolvedValue(area());

    const resultado = await service.update(
      '11111111-1111-1111-1111-111111111111',
      { name: 'Proyectos Sociales' },
      archivo(),
    );

    expect(storage.deleteRequired).toHaveBeenCalledWith(
      'focus-areas/eje-anterior.png',
    );
    expect(resultado.name).toBe('Proyectos Sociales');
    expect(resultado.imageUrl).toContain('focus-areas/nuevo.png');
  });

  it('rechaza con 409 si el eje tiene talleres y no purga la imagen', async () => {
    focusAreas.findOneBy.mockResolvedValue(area());
    workshops.count.mockResolvedValue(2);

    await expect(
      service.remove('11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(storage.deleteRequired).not.toHaveBeenCalled();
    expect(focusAreas.delete).not.toHaveBeenCalled();
  });

  it('elimina el eje y su imagen cuando no tiene talleres', async () => {
    focusAreas.findOneBy.mockResolvedValue(area());

    await service.remove('11111111-1111-1111-1111-111111111111');

    expect(storage.deleteRequired).toHaveBeenCalledWith(
      'focus-areas/eje-anterior.png',
    );
    expect(focusAreas.delete).toHaveBeenCalledWith({
      id: '11111111-1111-1111-1111-111111111111',
    });
  });

  it('avisa cuando el eje no existe', async () => {
    await expect(
      service.findOne('11111111-1111-1111-1111-111111111111'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

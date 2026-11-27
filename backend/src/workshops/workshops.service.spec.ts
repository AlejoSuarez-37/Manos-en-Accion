import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import type { StorageService } from '../storage/storage.service.js';
import { FocusArea } from './entities/focus-area.entity.js';
import { Workshop } from './entities/workshop.entity.js';
import { WorkshopsService } from './workshops.service.js';

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const PDF = Buffer.from('%PDF-1.7\n');

const imagen = () =>
  ({
    buffer: PNG,
    size: PNG.length,
    originalname: 'taller.png',
  }) as unknown as Express.Multer.File;

const pdf = () =>
  ({
    buffer: PDF,
    size: PDF.length,
    originalname: 'programa.pdf',
  }) as unknown as Express.Multer.File;

const idEje = '11111111-1111-1111-1111-111111111111';
const idTaller = '22222222-2222-2222-2222-222222222222';

const eje = (): FocusArea =>
  ({
    id: idEje,
    name: 'Proyectos Productivos',
    description: null,
    imageKey: 'focus-areas/eje.png',
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as FocusArea;

const taller = (overrides: Partial<Workshop> = {}): Workshop =>
  ({
    id: idTaller,
    title: 'Gastronomía con Propósito',
    description: 'Taller de cocina solidaria',
    imageKey: 'workshops/anterior.png',
    pdfKey: 'workshops/pdfs/anterior.pdf',
    pdfName: 'Programa anterior',
    focusArea: eje(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Workshop;

describe('WorkshopsService', () => {
  let workshops: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let focusAreas: { findOneBy: ReturnType<typeof vi.fn> };
  let storage: {
    uploadImage: ReturnType<typeof vi.fn>;
    uploadPdf: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    deleteRequired: ReturnType<typeof vi.fn>;
    getUrl: ReturnType<typeof vi.fn>;
    getPdfUrl: ReturnType<typeof vi.fn>;
  };
  let service: WorkshopsService;

  beforeEach(() => {
    workshops = {
      create: vi.fn((input) => input),
      save: vi.fn(async (input) => input),
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    focusAreas = { findOneBy: vi.fn().mockResolvedValue(eje()) };
    storage = {
      uploadImage: vi
        .fn()
        .mockResolvedValue({
          key: 'workshops/nuevo.png',
          url: 'https://cdn/nuevo',
        }),
      uploadPdf: vi
        .fn()
        .mockResolvedValue({
          key: 'workshops/pdfs/nuevo.pdf',
          url: 'https://cdn/pdf',
        }),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteRequired: vi.fn().mockResolvedValue(undefined),
      getUrl: vi.fn((key: string) => `https://cdn/${key}`),
      getPdfUrl: vi.fn((key: string) => `https://cdn/${key}`),
    };
    service = new WorkshopsService(
      workshops as unknown as Repository<Workshop>,
      focusAreas as unknown as Repository<FocusArea>,
      storage as unknown as StorageService,
    );
  });

  it('sube imagen y PDF al crear y guarda solo las claves', async () => {
    const resultado = await service.create(
      {
        title: 'Gastronomía con Propósito',
        description: 'Taller de cocina solidaria',
        focusAreaId: idEje,
        pdfName: undefined,
      },
      imagen(),
      pdf(),
    );

    expect(workshops.save).toHaveBeenCalledWith(
      expect.objectContaining({
        imageKey: 'workshops/nuevo.png',
        pdfKey: 'workshops/pdfs/nuevo.pdf',
        pdfName: 'programa.pdf',
      }),
    );
    expect(resultado.pdfUrl).toContain('workshops/pdfs/nuevo.pdf');
    expect(resultado.pdfName).toBe('programa.pdf');
    expect(resultado).not.toHaveProperty('imageKey');
    expect(resultado).not.toHaveProperty('pdfKey');
  });

  it('permite crear un taller sin PDF', async () => {
    await service.create(
      {
        title: 'Voluntariados',
        description: 'Taller sin adjunto',
        focusAreaId: idEje,
        pdfName: undefined,
      },
      imagen(),
    );

    expect(storage.uploadPdf).not.toHaveBeenCalled();
    expect(workshops.save).toHaveBeenCalledWith(
      expect.objectContaining({ pdfKey: null, pdfName: null }),
    );
  });

  it('rechaza un eje inexistente con 400 antes de subir archivos', async () => {
    focusAreas.findOneBy.mockResolvedValue(null);

    await expect(
      service.create(
        {
          title: 'Sin eje',
          description: 'Datos inválidos',
          focusAreaId: idEje,
          pdfName: undefined,
        },
        imagen(),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('limpia imagen y PDF si falla el guardado al crear', async () => {
    workshops.save.mockRejectedValueOnce(new Error('DB caída'));

    await expect(
      service.create(
        {
          title: 'Con adjunto',
          description: 'Datos',
          focusAreaId: idEje,
          pdfName: undefined,
        },
        imagen(),
        pdf(),
      ),
    ).rejects.toThrow('DB caída');
    expect(storage.delete).toHaveBeenCalledWith('workshops/nuevo.png');
    expect(storage.delete).toHaveBeenCalledWith(
      'workshops/pdfs/nuevo.pdf',
      'raw',
    );
  });

  it('limpia la imagen si falla la subida del PDF al crear', async () => {
    storage.uploadPdf.mockRejectedValueOnce(new Error('Cloudinary caído'));

    await expect(
      service.create(
        {
          title: 'Con adjunto',
          description: 'Datos',
          focusAreaId: idEje,
          pdfName: undefined,
        },
        imagen(),
        pdf(),
      ),
    ).rejects.toThrow('Cloudinary caído');
    expect(storage.delete).toHaveBeenCalledWith('workshops/nuevo.png');
    expect(workshops.save).not.toHaveBeenCalled();
  });

  it('reemplaza el PDF anterior al actualizar', async () => {
    workshops.findOne.mockResolvedValue(taller());

    const resultado = await service.update(idTaller, {}, undefined, pdf());

    expect(storage.deleteRequired).toHaveBeenCalledWith(
      'workshops/pdfs/anterior.pdf',
      'raw',
    );
    expect(resultado.pdfUrl).toContain('workshops/pdfs/nuevo.pdf');
  });

  it('elimina el taller con su imagen y su PDF', async () => {
    workshops.findOne.mockResolvedValue(taller());

    await service.remove(idTaller);

    expect(storage.deleteRequired).toHaveBeenCalledWith(
      'workshops/anterior.png',
    );
    expect(storage.deleteRequired).toHaveBeenCalledWith(
      'workshops/pdfs/anterior.pdf',
      'raw',
    );
    expect(workshops.delete).toHaveBeenCalledWith({ id: idTaller });
  });

  it('desvincula el PDF sin borrar el taller', async () => {
    workshops.findOne.mockResolvedValue(taller());

    await service.removePdf(idTaller);

    expect(storage.deleteRequired).toHaveBeenCalledWith(
      'workshops/pdfs/anterior.pdf',
      'raw',
    );
    expect(workshops.save).toHaveBeenCalledWith(
      expect.objectContaining({ pdfKey: null, pdfName: null }),
    );
  });

  it('filtra el listado por eje de acción', async () => {
    workshops.find.mockResolvedValue([taller()]);

    const resultado = await service.findAll(idEje);

    expect(workshops.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { focusArea: { id: idEje } } }),
    );
    expect(resultado[0].focusAreaId).toBe(idEje);
  });

  it('avisa cuando el taller no existe', async () => {
    await expect(service.findOne(idTaller)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

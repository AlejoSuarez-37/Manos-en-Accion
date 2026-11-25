import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { TEAM_IMAGE_RULE } from '../storage/image-rules.js';
import { StorageService } from '../storage/storage.service.js';
import { TeamMember } from './entities/team-member.entity.js';
import { TeamMembersService } from './team-members.service.js';

const PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);

const archivo = () =>
  ({ buffer: PNG, size: PNG.length, originalname: 'foto.png' }) as unknown as Express.Multer.File;

const miembro = (overrides: Partial<TeamMember> = {}): TeamMember =>
  ({
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Ana Pérez',
    role: 'Coordinadora',
    bio: 'Biografía',
    imageKey: 'team-members/ana.png',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as TeamMember;

describe('TeamMembersService', () => {
  let members: {
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
  let service: TeamMembersService;

  beforeEach(() => {
    members = {
      create: vi.fn((input) => input),
      save: vi.fn(async (input) => input),
      find: vi.fn().mockResolvedValue([]),
      findOneBy: vi.fn().mockResolvedValue(null),
      delete: vi.fn().mockResolvedValue({ affected: 1 }),
    };
    storage = {
      uploadImage: vi
        .fn()
        .mockResolvedValue({ key: 'team-members/nueva.png', url: 'https://cdn/nueva' }),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteRequired: vi.fn().mockResolvedValue(undefined),
      getUrl: vi.fn((key: string) => `https://cdn/${key}`),
    };
    service = new TeamMembersService(
      members as unknown as Repository<TeamMember>,
      storage as unknown as StorageService,
    );
  });

  it('sube la imagen al crear y guarda solo la clave', async () => {
    const resultado = await service.create(
      { name: 'Ana', role: 'Coordinadora', bio: undefined },
      archivo(),
    );

    expect(storage.uploadImage).toHaveBeenCalledWith(
      expect.any(Object),
      TEAM_IMAGE_RULE,
    );
    expect(members.create).toHaveBeenCalledWith({
      name: 'Ana',
      role: 'Coordinadora',
      bio: null,
      imageKey: 'team-members/nueva.png',
    });
    expect(resultado.imageUrl).toContain('team-members/nueva.png');
    expect(resultado).not.toHaveProperty('imageKey');
  });

  it('limpia la imagen subida si falla el guardado', async () => {
    members.save.mockRejectedValue(new Error('falló la base'));

    await expect(
      service.create({ name: 'Ana', role: 'Coordinadora' }, archivo()),
    ).rejects.toThrow('falló la base');
    expect(storage.delete).toHaveBeenCalledWith('team-members/nueva.png');
  });

  it('borra la imagen anterior antes de guardar el reemplazo', async () => {
    members.findOneBy.mockResolvedValue(miembro());

    await service.update(
      '11111111-1111-1111-1111-111111111111',
      { name: 'Ana Actualizada' },
      archivo(),
    );

    expect(storage.uploadImage).toHaveBeenCalled();
    expect(storage.deleteRequired).toHaveBeenCalledWith('team-members/ana.png');
    expect(storage.deleteRequired.mock.invocationCallOrder[0]).toBeLessThan(
      members.save.mock.invocationCallOrder[0],
    );
    expect(members.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ana Actualizada',
        imageKey: 'team-members/nueva.png',
      }),
    );
  });

  it('no guarda ni deja la imagen nueva si falla el borrado de la anterior', async () => {
    members.findOneBy.mockResolvedValue(miembro());
    storage.deleteRequired.mockRejectedValue(new Error('Cloudinary caído'));

    await expect(
      service.update(
        '11111111-1111-1111-1111-111111111111',
        { name: 'Ana Actualizada' },
        archivo(),
      ),
    ).rejects.toThrow('Cloudinary caído');

    expect(members.save).not.toHaveBeenCalled();
    expect(storage.delete).toHaveBeenCalledWith('team-members/nueva.png');
  });

  it('no toca imágenes en una actualización sin foto', async () => {
    members.findOneBy.mockResolvedValue(miembro());

    await service.update('11111111-1111-1111-1111-111111111111', {
      role: 'Nuevo rol',
    });

    expect(storage.uploadImage).not.toHaveBeenCalled();
    expect(storage.deleteRequired).not.toHaveBeenCalled();
    expect(storage.delete).not.toHaveBeenCalled();
  });

  it('elimina la fila y la imagen en un DELETE', async () => {
    members.findOneBy.mockResolvedValue(miembro());

    await service.remove('11111111-1111-1111-1111-111111111111');

    expect(storage.deleteRequired).toHaveBeenCalledWith('team-members/ana.png');
    expect(storage.deleteRequired.mock.invocationCallOrder[0]).toBeLessThan(
      members.delete.mock.invocationCallOrder[0],
    );
    expect(members.delete).toHaveBeenCalledWith({
      id: '11111111-1111-1111-1111-111111111111',
    });
    expect(members.save).not.toHaveBeenCalled();
  });

  it('no borra la fila si falla Cloudinary', async () => {
    members.findOneBy.mockResolvedValue(miembro());
    storage.deleteRequired.mockRejectedValue(new Error('Cloudinary caído'));

    await expect(
      service.remove('11111111-1111-1111-1111-111111111111'),
    ).rejects.toThrow('Cloudinary caído');
    expect(members.delete).not.toHaveBeenCalled();
  });

  it('lista todos los miembros en la vista pública', async () => {
    members.find.mockResolvedValue([miembro()]);

    const resultado = await service.findAll();

    expect(members.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
    expect(resultado[0]).toEqual(
      expect.objectContaining({ imageUrl: 'https://cdn/team-members/ana.png' }),
    );
    expect(resultado[0]).not.toHaveProperty('active');
  });

  it('falla con 404 si el miembro no existe', async () => {
    await expect(service.findOne('no-existe')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

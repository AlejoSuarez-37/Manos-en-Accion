import type { INestApplication } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { STORAGE_ADAPTER, type StorageAdapter } from '../src/storage/storage.types.js';

describe('Team members (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let uploadMock: ReturnType<typeof vi.fn>;
  let deleteMock: ReturnType<typeof vi.fn>;
  let counter: number;

  const PNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const png = (extraBytes = 0) => Buffer.concat([PNG, Buffer.alloc(extraBytes)]);
  const unknownId = '00000000-0000-0000-0000-000000000000';

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@manosenaccion.org';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPassword123';
  const editorEmail = process.env.SEED_EDITOR_EMAIL ?? 'editor@manosenaccion.org';
  const editorPassword =
    process.env.SEED_EDITOR_PASSWORD ?? 'EditorPassword123';

  beforeEach(async () => {
    counter = 0;
    uploadMock = vi.fn(async (_file: unknown, _mime: string, rule: { folder: string }) => {
      const key = `${rule.folder}/foto-${++counter}`;
      return { key, url: `https://cdn.test/${key}` };
    });
    deleteMock = vi.fn(async () => undefined);

    const adapter = {
      upload: uploadMock,
      delete: deleteMock,
      getUrl: (key: string) => `https://cdn.test/${key}`,
    } as unknown as StorageAdapter;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .overrideProvider(STORAGE_ADAPTER)
      .useValue(adapter)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  const bearer = (token: string) => `Bearer ${token}`;

  const getToken = async (email: string, password: string): Promise<string> => {
    const response = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return response.body.accessToken;
  };

  const createMember = (
    token: string,
    overrides: {
      name?: string;
      role?: string;
      bio?: string;
      file?: Buffer;
      filename?: string;
    } = {},
  ) => {
    let req = request(server)
      .post('/team-members')
      .set('Authorization', bearer(token));

    if (overrides.name !== undefined) {
      req = req.field('name', overrides.name);
    }
    if (overrides.role !== undefined) {
      req = req.field('role', overrides.role);
    }
    if (overrides.bio !== undefined) {
      req = req.field('bio', overrides.bio);
    }
    if (overrides.file !== undefined) {
      req = req.attach('image', overrides.file, overrides.filename ?? 'foto.png');
    }
    return req;
  };

  it('permite ver el equipo público sin token y crea miembros con foto', async () => {
    const publicList = await request(server).get('/team-members').expect(200);
    expect(publicList.body).toEqual([]);

    const token = await getToken(adminEmail, adminPassword);
    const response = await createMember(token, {
      name: ' Ana Pérez ',
      role: 'Coordinadora',
      bio: 'Biografía',
      file: png(),
    }).expect(201);

    expect(response.body).toMatchObject({
      name: 'Ana Pérez',
      role: 'Coordinadora',
      bio: 'Biografía',
    });
    expect(response.body.imageUrl).toContain('team-members/foto-1');
    expect(response.body).not.toHaveProperty('imageKey');
    expect(uploadMock).toHaveBeenCalledTimes(1);

    const members = await request(server).get('/team-members').expect(200);
    expect(members.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: response.body.id }),
      ]),
    );
    expect(members.body[0]).not.toHaveProperty('imageKey');
  });

  it('exige token y permite editar a administradores y editores', async () => {
    await request(server).get(`/team-members/${unknownId}`).expect(401);
    await createMember('token-invalido', { file: png() }).expect(401);

    const editorToken = await getToken(editorEmail, editorPassword);
    await createMember(editorToken, {
      name: 'Editor',
      role: 'Editor',
      file: png(),
    }).expect(201);
  });

  it('rechaza ID inválidos, miembros inexistentes y campos incompletos', async () => {
    const token = await getToken(adminEmail, adminPassword);

    await createMember(token, { name: 'Sin rol', file: png() }).expect(400);
    await createMember(token, { name: 'Sin foto', role: 'Rol' }).expect(400);
    await request(server)
      .get('/team-members/not-a-uuid')
      .set('Authorization', bearer(token))
      .expect(400);
    await request(server)
      .get(`/team-members/${unknownId}`)
      .set('Authorization', bearer(token))
      .expect(404);
  });

  it('rechaza formatos no permitidos, imágenes grandes y traduce fallos del proveedor', async () => {
    const token = await getToken(adminEmail, adminPassword);
    const html = Buffer.from('<script>alert(1)</script>');

    await createMember(token, {
      name: 'Falso',
      role: 'Rol',
      file: html,
      filename: 'foto.png',
    }).expect(415);
    await createMember(token, {
      name: 'Grande',
      role: 'Rol',
      file: png(5 * 1024 * 1024),
    }).expect(400);
    expect(uploadMock).not.toHaveBeenCalled();

    uploadMock.mockRejectedValueOnce(new Error('Cloudinary caído'));
    await createMember(token, {
      name: 'Sin servicio',
      role: 'Rol',
      file: png(),
    }).expect(502);
  });

  it('actualiza datos y foto, y elimina el miembro con su imagen', async () => {
    const token = await getToken(adminEmail, adminPassword);
    const created = await createMember(token, {
      name: 'Ana',
      role: 'Coordinadora',
      file: png(),
    }).expect(201);
    const id = created.body.id as string;

    const updated = await request(server)
      .patch(`/team-members/${id}`)
      .set('Authorization', bearer(token))
      .field('name', 'Ana Actualizada')
      .attach('image', png(), 'nueva.png')
      .expect(200);

    expect(updated.body.name).toBe('Ana Actualizada');
    expect(updated.body.imageUrl).toContain('team-members/foto-2');
    expect(deleteMock).toHaveBeenCalledWith('team-members/foto-1');

    await request(server)
      .delete(`/team-members/${id}`)
      .set('Authorization', bearer(token))
      .expect(204);

    expect(deleteMock).toHaveBeenCalledWith('team-members/foto-2');

    await request(server)
      .get(`/team-members/${id}`)
      .set('Authorization', bearer(token))
      .expect(404);

    const publicList = await request(server).get('/team-members').expect(200);
    expect(publicList.body).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id })]),
    );
  });

  it('responde 502 y conserva la fila si falla el borrado en Cloudinary', async () => {
    const token = await getToken(adminEmail, adminPassword);
    const created = await createMember(token, {
      name: 'Ana',
      role: 'Coordinadora',
      file: png(),
    }).expect(201);
    const id = created.body.id as string;

    deleteMock.mockRejectedValue(new Error('Cloudinary caído'));

    await request(server)
      .delete(`/team-members/${id}`)
      .set('Authorization', bearer(token))
      .expect(502);

    const conservado = await request(server)
      .get(`/team-members/${id}`)
      .set('Authorization', bearer(token))
      .expect(200);
    expect(conservado.body.id).toBe(id);
    expect(deleteMock).toHaveBeenCalledWith('team-members/foto-1');
  });
});

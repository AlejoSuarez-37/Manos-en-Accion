import type { INestApplication } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import {
  STORAGE_ADAPTER,
  type StorageAdapter,
} from '../src/storage/storage.types.js';

describe('Workshops y focus areas (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let uploadMock: ReturnType<typeof vi.fn>;
  let uploadPdfMock: ReturnType<typeof vi.fn>;
  let deleteMock: ReturnType<typeof vi.fn>;
  let counter: number;

  const PNG = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
  ]);
  const PDF = Buffer.from('%PDF-1.7\n');
  const png = (extraBytes = 0) =>
    Buffer.concat([PNG, Buffer.alloc(extraBytes)]);
  const unknownId = '00000000-0000-0000-0000-000000000000';

  type Agent = ReturnType<typeof request.agent>;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@manosenaccion.org';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPassword123';
  const editorEmail =
    process.env.SEED_EDITOR_EMAIL ?? 'editor@manosenaccion.org';
  const editorPassword =
    process.env.SEED_EDITOR_PASSWORD ?? 'EditorPassword123';

  beforeEach(async () => {
    counter = 0;
    uploadMock = vi.fn(
      async (_file: unknown, _mime: string, rule: { folder: string }) => {
        const key = `${rule.folder}/foto-${++counter}`;
        return { key, url: `https://cdn.test/${key}` };
      },
    );
    uploadPdfMock = vi.fn(
      async (_file: unknown, _mime: string, rule: { folder: string }) => {
        const key = `${rule.folder}/pdf-${++counter}`;
        return { key, url: `https://cdn.test/${key}` };
      },
    );
    deleteMock = vi.fn(async () => undefined);

    const adapter = {
      upload: uploadMock,
      uploadPdf: uploadPdfMock,
      delete: deleteMock,
      getUrl: (key: string) => `https://cdn.test/${key}`,
      getPdfUrl: (key: string) => `https://cdn.test/${key}`,
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

  const signIn = async (email: string, password: string): Promise<Agent> => {
    const agent = request.agent(server);
    await agent.post('/auth/login').send({ email, password }).expect(200);
    return agent;
  };

  const createArea = (
    agent: Agent,
    overrides: { name?: string; description?: string; file?: Buffer } = {},
  ) => {
    let req = agent.post('/focus-areas');
    if (overrides.name !== undefined) {
      req = req.field('name', overrides.name);
    }
    if (overrides.description !== undefined) {
      req = req.field('description', overrides.description);
    }
    req = req.attach('image', overrides.file ?? png(), 'eje.png');
    return req;
  };

  const createWorkshop = (
    agent: Agent,
    focusAreaId: string,
    overrides: {
      title?: string;
      description?: string;
      pdfName?: string;
      image?: Buffer;
      pdf?: Buffer;
      pdfFilename?: string;
      omitImage?: boolean;
    } = {},
  ) => {
    let req = agent.post('/workshops');
    req = req.field('title', overrides.title ?? 'Gastronomía con Propósito');
    req = req.field(
      'description',
      overrides.description ?? 'Taller de cocina solidaria',
    );
    req = req.field('focusAreaId', focusAreaId);
    if (overrides.pdfName !== undefined) {
      req = req.field('pdfName', overrides.pdfName);
    }
    if (!overrides.omitImage) {
      req = req.attach('image', overrides.image ?? png(), 'taller.png');
    }
    if (overrides.pdf !== undefined) {
      req = req.attach(
        'pdf',
        overrides.pdf,
        overrides.pdfFilename ?? 'programa.pdf',
      );
    }
    return req;
  };

  it('crea ejes y talleres con imagen y PDF, y los expone agrupados públicamente', async () => {
    expect(
      (await request(server).get('/focus-areas').expect(200)).body,
    ).toEqual([]);
    expect((await request(server).get('/workshops').expect(200)).body).toEqual(
      [],
    );

    const admin = await signIn(adminEmail, adminPassword);
    const area = await createArea(admin, {
      name: ' Proyectos Productivos ',
      description: 'Emprendimientos comunitarios',
    }).expect(201);
    expect(area.body.name).toBe('Proyectos Productivos');
    expect(area.body.workshops).toEqual([]);
    expect(area.body.imageUrl).toContain('focus-areas/foto-1');
    expect(area.body).not.toHaveProperty('imageKey');

    const workshop = await createWorkshop(admin, area.body.id as string, {
      pdfName: 'Programa del taller',
      pdf: PDF,
    }).expect(201);
    expect(workshop.body).toMatchObject({
      title: 'Gastronomía con Propósito',
      pdfName: 'Programa del taller',
      focusAreaId: area.body.id,
    });
    expect(workshop.body.imageUrl).toContain('workshops/foto-2');
    expect(workshop.body.pdfUrl).toContain('workshops/pdfs/pdf-3');
    expect(workshop.body).not.toHaveProperty('imageKey');
    expect(workshop.body).not.toHaveProperty('pdfKey');

    const publicAreas = await request(server).get('/focus-areas').expect(200);
    expect(publicAreas.body[0].workshops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: workshop.body.id }),
      ]),
    );
    const filtered = await request(server)
      .get('/workshops')
      .query({ focusAreaId: area.body.id })
      .expect(200);
    expect(filtered.body).toHaveLength(1);
    const detail = await request(server)
      .get(`/workshops/${workshop.body.id}`)
      .expect(200);
    expect(detail.body.pdfName).toBe('Programa del taller');
  });

  it('exige sesión para escribir y permite a editores gestionar contenido', async () => {
    await createArea(request.agent(server), { name: 'Sin sesión' }).expect(401);
    await createWorkshop(request.agent(server), unknownId).expect(401);

    const editor = await signIn(editorEmail, editorPassword);
    const area = await createArea(editor, { name: 'Voluntariados' }).expect(
      201,
    );
    await createWorkshop(editor, area.body.id as string).expect(201);
  });

  it('rechaza datos inválidos, ejes inexistentes y formatos no permitidos', async () => {
    const admin = await signIn(adminEmail, adminPassword);
    const area = await createArea(admin, {
      name: 'Proyectos Productivos',
    }).expect(201);

    await createWorkshop(admin, area.body.id as string, {
      title: '',
      description: '',
    }).expect(400);
    await createWorkshop(admin, unknownId).expect(400);
    await createWorkshop(admin, 'no-es-uuid').expect(400);
    await createWorkshop(admin, area.body.id as string, {
      omitImage: true,
    }).expect(400);
    await createWorkshop(admin, area.body.id as string, {
      image: png(5 * 1024 * 1024),
    }).expect(400);
    await createWorkshop(admin, area.body.id as string, {
      pdf: Buffer.from('<script>alert(1)</script>'),
    }).expect(415);

    await admin.delete('/focus-areas/not-a-uuid').expect(400);
    await admin.get(`/focus-areas/${unknownId}`).expect(404);
    await admin.get(`/workshops/${unknownId}`).expect(404);
    expect(uploadPdfMock).not.toHaveBeenCalled();
  });

  it('reemplaza imagen y PDF, desvincula el PDF y purga todo al borrar el taller', async () => {
    const admin = await signIn(adminEmail, adminPassword);
    const area = await createArea(admin, {
      name: 'Proyectos Productivos',
    }).expect(201);
    const created = await createWorkshop(admin, area.body.id as string, {
      pdf: PDF,
    }).expect(201);
    const id = created.body.id as string;

    const updated = await admin
      .patch(`/workshops/${id}`)
      .attach('image', png(), 'nueva.png')
      .attach('pdf', PDF, 'nuevo.pdf')
      .field('pdfName', 'Programa actualizado')
      .expect(200);
    expect(updated.body.pdfName).toBe('Programa actualizado');
    expect(deleteMock).toHaveBeenCalledWith('workshops/foto-2', 'image');
    expect(deleteMock).toHaveBeenCalledWith('workshops/pdfs/pdf-3', 'raw');

    await admin.delete(`/workshops/${id}/pdf`).expect(204);
    expect(
      (await request(server).get(`/workshops/${id}`).expect(200)).body.pdfUrl,
    ).toBeNull();

    await admin.delete(`/workshops/${id}`).expect(204);
    expect(deleteMock).toHaveBeenCalledWith('workshops/foto-4', 'image');
    expect(deleteMock).toHaveBeenCalledWith('workshops/pdfs/pdf-5', 'raw');
    await request(server).get(`/workshops/${id}`).expect(404);
  });

  it('devuelve 409 al borrar un eje con talleres y 204 cuando ya no los tiene', async () => {
    const admin = await signIn(adminEmail, adminPassword);
    const area = await createArea(admin, { name: 'Voluntariados' }).expect(201);
    const workshop = await createWorkshop(admin, area.body.id as string).expect(
      201,
    );

    const respuesta = await admin
      .delete(`/focus-areas/${area.body.id}`)
      .expect(409);
    expect(respuesta.body.message).toContain('tiene talleres asociados');
    expect(deleteMock).not.toHaveBeenCalled();

    await admin.delete(`/workshops/${workshop.body.id}`).expect(204);
    await admin.delete(`/focus-areas/${area.body.id}`).expect(204);
    expect(deleteMock).toHaveBeenCalledWith('focus-areas/foto-1', 'image');
  });

  it('responde 502 y conserva el taller si falla el borrado del PDF en Cloudinary', async () => {
    const admin = await signIn(adminEmail, adminPassword);
    const area = await createArea(admin, { name: 'Voluntariados' }).expect(201);
    const workshop = await createWorkshop(admin, area.body.id as string, {
      pdf: PDF,
    }).expect(201);

    deleteMock.mockImplementation(
      async (key: string, resourceType?: string) => {
        if (resourceType === 'raw') {
          throw new Error('Cloudinary caído');
        }
        return undefined;
      },
    );

    await admin.delete(`/workshops/${workshop.body.id}`).expect(502);
    const conservado = await request(server)
      .get(`/workshops/${workshop.body.id}`)
      .expect(200);
    expect(conservado.body.id).toBe(workshop.body.id);
  });
});

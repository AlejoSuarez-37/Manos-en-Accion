import type { INestApplication } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../app.module.js';
import { STORAGE_ADAPTER, type StorageAdapter } from '../storage/storage.types.js';

describe('Banners (e2e)', () => {
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

    type Agent = ReturnType<typeof request.agent>;

    const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@manosenaccion.org';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPassword123';
    const editorEmail = process.env.SEED_EDITOR_EMAIL ?? 'editor@manosenaccion.org';
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

    const signIn = async (email: string, password: string): Promise<Agent> => {
        const agent = request.agent(server);
        await agent.post('/auth/login').send({ email, password }).expect(200);
        return agent;
    };

    const createBanner = (
        agent: Agent,
        file?: Buffer,
        filename = 'banner.png',
    ) => {
        const req = agent.post('/banners');
        return file === undefined ? req : req.attach('image', file, filename);
    };

    it('lista públicamente en orden y asigna posiciones automáticas al crear', async () => {
        const publicList = await request(server).get('/banners').expect(200);
        expect(publicList.body).toEqual([]);

        const admin = await signIn(adminEmail, adminPassword);
        const first = await createBanner(admin, png()).expect(201);
        const second = await createBanner(admin, png()).expect(201);

        expect(first.body).toMatchObject({ position: 1 });
        expect(first.body.imageUrl).toContain('banners/foto-1');
        expect(first.body).not.toHaveProperty('imageKey');
        expect(second.body).toMatchObject({ position: 2 });
        expect(second.body.imageUrl).toContain('banners/foto-2');

        const ordered = await request(server).get('/banners').expect(200);
        expect(ordered.body.map((banner: { position: number }) => banner.position)).toEqual([
            1, 2,
        ]);
    });

    it('exige sesión y permite crear a administradores y editores', async () => {
        await request(server).get(`/banners/${unknownId}`).expect(401);
        await createBanner(request.agent(server), png()).expect(401);

        const editor = await signIn(editorEmail, editorPassword);
        await createBanner(editor, png()).expect(201);
    });

    it('rechaza ID inválido, banner inexistente, PATCH vacío y creación sin imagen', async () => {
        const admin = await signIn(adminEmail, adminPassword);

        await createBanner(admin).expect(400);
        await admin.get('/banners/not-a-uuid').expect(400);
        await admin.get(`/banners/${unknownId}`).expect(404);

        const created = await createBanner(admin, png()).expect(201);
        await admin.patch(`/banners/${created.body.id}`).expect(400);
    });

    it('rechaza formatos no permitidos, imágenes grandes y traduce fallos del proveedor', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const html = Buffer.from('<script>alert(1)</script>');

        await createBanner(admin, html, 'banner.png').expect(415);
        await createBanner(admin, png(5 * 1024 * 1024)).expect(400);
        expect(uploadMock).not.toHaveBeenCalled();

        uploadMock.mockRejectedValueOnce(new Error('Cloudinary caído'));
        await createBanner(admin, png()).expect(502);
    });

    it('cambia el orden con PATCH y respeta la posición cuando el campo está vacío', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const first = await createBanner(admin, png()).expect(201);
        await createBanner(admin, png()).expect(201);

        const reordered = await admin
            .patch(`/banners/${first.body.id}`)
            .field('position', '5')
            .expect(200);
        expect(reordered.body.position).toBe(5);

        const ordered = await request(server).get('/banners').expect(200);
        expect(ordered.body.map((banner: { position: number }) => banner.position)).toEqual([
            2, 5,
        ]);

        const withEmptyPosition = await admin
            .patch(`/banners/${first.body.id}`)
            .field('position', '')
            .attach('image', png(), 'nuevo.png')
            .expect(200);
        expect(withEmptyPosition.body.position).toBe(5);
        expect(withEmptyPosition.body.imageUrl).toContain('banners/foto-3');
    });

    it('convierte la posición enviada como texto y rechaza posiciones inválidas', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const created = await createBanner(admin, png()).expect(201);
        const id = created.body.id as string;

        await admin.patch(`/banners/${id}`).field('position', 'abc').expect(400);
        await admin.patch(`/banners/${id}`).field('position', '0').expect(400);

        const updated = await admin
            .patch(`/banners/${id}`)
            .field('position', '3')
            .expect(200);
        expect(updated.body.position).toBe(3);

        const conservado = await admin.get(`/banners/${id}`).expect(200);
        expect(conservado.body.position).toBe(3);
    });

    it('reemplaza la imagen con PATCH y elimina el banner con DELETE', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const created = await createBanner(admin, png()).expect(201);
        const id = created.body.id as string;

        const updated = await admin
            .patch(`/banners/${id}`)
            .attach('image', png(), 'nuevo.png')
            .expect(200);

        expect(updated.body.position).toBe(1);
        expect(updated.body.imageUrl).toContain('banners/foto-2');
        expect(deleteMock).toHaveBeenCalledWith('banners/foto-1');

        await admin.delete(`/banners/${id}`).expect(204);
        expect(deleteMock).toHaveBeenCalledWith('banners/foto-2');

        await admin.get(`/banners/${id}`).expect(404);
        const publicList = await request(server).get('/banners').expect(200);
        expect(publicList.body).toEqual([]);
    });

    it('responde 502 y conserva la fila si falla el borrado en Cloudinary', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const created = await createBanner(admin, png()).expect(201);
        const id = created.body.id as string;

        deleteMock.mockRejectedValue(new Error('Cloudinary caído'));
        await admin.delete(`/banners/${id}`).expect(502);

        const conservado = await admin.get(`/banners/${id}`).expect(200);
        expect(conservado.body.id).toBe(id);
        expect(deleteMock).toHaveBeenCalledWith('banners/foto-1');
    });
});

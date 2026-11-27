import type { INestApplication } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../app.module.js';
import type { SponsorCategory } from './entities/sponsor.entity.js';
import { STORAGE_ADAPTER, type StorageAdapter } from '../storage/storage.types.js';

describe('Sponsors (e2e)', () => {
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

    const createSponsor = (
        agent: Agent,
        overrides: {
            name?: string;
            category?: SponsorCategory;
            websiteUrl?: string;
            file?: Buffer;
            filename?: string;
        } = {},
    ) => {
        let req = agent.post('/sponsors');

        if (overrides.name !== undefined) {
            req = req.field('name', overrides.name);
        }
        if (overrides.category !== undefined) {
            req = req.field('category', overrides.category);
        }
        if (overrides.websiteUrl !== undefined) {
            req = req.field('websiteUrl', overrides.websiteUrl);
        }
        if (overrides.file !== undefined) {
            req = req.attach(
                'image',
                overrides.file,
                overrides.filename ?? 'logo.png',
            );
        }
        return req;
    };

    it('lista públicamente, filtra por categoría y crea sponsors con logo y link', async () => {
        const publicList = await request(server).get('/sponsors').expect(200);
        expect(publicList.body).toEqual([]);

        const admin = await signIn(adminEmail, adminPassword);

        await createSponsor(admin, {
            name: 'Corporativa',
            category: 'corporate_support',
            websiteUrl: 'https://corporativa.org',
            file: png(),
        }).expect(201);

        const sinLink = await createSponsor(admin, {
            name: 'Amiga',
            category: 'friend_organizations',
            file: png(),
        }).expect(201);

        expect(sinLink.body).toMatchObject({
            name: 'Amiga',
            category: 'friend_organizations',
            websiteUrl: null,
        });
        expect(sinLink.body.imageUrl).toContain('sponsors/foto-2');
        expect(sinLink.body).not.toHaveProperty('imageKey');

        const corporativos = await request(server)
            .get('/sponsors?category=corporate_support')
            .expect(200);
        expect(corporativos.body).toHaveLength(1);
        expect(corporativos.body[0]).toMatchObject({
            name: 'Corporativa',
            category: 'corporate_support',
            websiteUrl: 'https://corporativa.org',
        });
        expect(corporativos.body[0]).not.toHaveProperty('imageKey');

        const amigos = await request(server)
            .get('/sponsors?category=friend_organizations')
            .expect(200);
        expect(amigos.body).toHaveLength(1);
        expect(amigos.body[0].name).toBe('Amiga');

        await request(server).get('/sponsors?category=invalida').expect(400);
    });

    it('exige sesión y permite editar a administradores y editores', async () => {
        await request(server).get(`/sponsors/${unknownId}`).expect(401);
        await createSponsor(request.agent(server), {
            category: 'corporate_support',
            file: png(),
        }).expect(401);

        const editor = await signIn(editorEmail, editorPassword);
        await createSponsor(editor, {
            name: 'Editor',
            category: 'corporate_support',
            file: png(),
        }).expect(201);
    });

    it('rechaza ID inválido, sponsor inexistente y campos incompletos', async () => {
        const admin = await signIn(adminEmail, adminPassword);

        await createSponsor(admin, {
            name: 'Sin categoría',
            file: png(),
        }).expect(400);
        await createSponsor(admin, {
            name: 'Sin foto',
            category: 'corporate_support',
        }).expect(400);
        await admin.get('/sponsors/not-a-uuid').expect(400);
        await admin.get(`/sponsors/${unknownId}`).expect(404);
    });

    it('rechaza URLs inseguras, formatos no permitidos, imágenes grandes y traduce fallos del proveedor', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const html = Buffer.from('<script>alert(1)</script>');

        await createSponsor(admin, {
            name: 'URL insegura',
            category: 'corporate_support',
            websiteUrl: 'javascript:alert(1)',
            file: png(),
        }).expect(400);

        await createSponsor(admin, {
            name: 'Falso',
            category: 'corporate_support',
            file: html,
            filename: 'logo.png',
        }).expect(415);

        await createSponsor(admin, {
            name: 'Grande',
            category: 'corporate_support',
            file: png(5 * 1024 * 1024),
        }).expect(400);
        expect(uploadMock).not.toHaveBeenCalled();

        uploadMock.mockRejectedValueOnce(new Error('Cloudinary caído'));
        await createSponsor(admin, {
            name: 'Sin servicio',
            category: 'corporate_support',
            file: png(),
        }).expect(502);
    });

    it('actualiza datos, link y logo, limpia el link con string vacío y elimina el sponsor', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const created = await createSponsor(admin, {
            name: 'Marca',
            category: 'corporate_support',
            websiteUrl: 'https://marca.org',
            file: png(),
        }).expect(201);
        const id = created.body.id as string;

        const updated = await admin
            .patch(`/sponsors/${id}`)
            .field('name', 'Marca Actualizada')
            .field('category', 'friend_organizations')
            .field('websiteUrl', 'https://nueva.org')
            .attach('image', png(), 'nuevo.png')
            .expect(200);

        expect(updated.body).toMatchObject({
            name: 'Marca Actualizada',
            category: 'friend_organizations',
            websiteUrl: 'https://nueva.org',
        });
        expect(updated.body.imageUrl).toContain('sponsors/foto-2');
        expect(deleteMock).toHaveBeenCalledWith('sponsors/foto-1');

        const cleared = await admin
            .patch(`/sponsors/${id}`)
            .field('websiteUrl', '')
            .expect(200);
        expect(cleared.body.websiteUrl).toBeNull();
        expect(uploadMock).toHaveBeenCalledTimes(2);
        expect(deleteMock).toHaveBeenCalledTimes(1);

        await admin.delete(`/sponsors/${id}`).expect(204);
        expect(deleteMock).toHaveBeenCalledWith('sponsors/foto-2');

        await admin.get(`/sponsors/${id}`).expect(404);

        const publicList = await request(server).get('/sponsors').expect(200);
        expect(publicList.body).not.toEqual(
            expect.arrayContaining([expect.objectContaining({ id })]),
        );
    });

    it('permite actualizar solo el logo y rechaza un PATCH vacío', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const created = await createSponsor(admin, {
            name: 'Solo logo',
            category: 'corporate_support',
            file: png(),
        }).expect(201);
        const id = created.body.id as string;

        const updated = await admin
            .patch(`/sponsors/${id}`)
            .attach('image', png(), 'logo.png')
            .expect(200);

        expect(updated.body.name).toBe('Solo logo');
        expect(updated.body.imageUrl).toContain('sponsors/foto-2');
        expect(deleteMock).toHaveBeenCalledWith('sponsors/foto-1');

        await admin.patch(`/sponsors/${id}`).expect(400);
        expect(uploadMock).toHaveBeenCalledTimes(2);
    });

    it('responde 502 y conserva la fila si falla el borrado en Cloudinary', async () => {
        const admin = await signIn(adminEmail, adminPassword);
        const created = await createSponsor(admin, {
            name: 'Marca',
            category: 'corporate_support',
            file: png(),
        }).expect(201);
        const id = created.body.id as string;

        deleteMock.mockRejectedValue(new Error('Cloudinary caído'));

        await admin.delete(`/sponsors/${id}`).expect(502);

        const conservado = await admin.get(`/sponsors/${id}`).expect(200);
        expect(conservado.body.id).toBe(id);
        expect(deleteMock).toHaveBeenCalledWith('sponsors/foto-1');
    });
});
import type { INestApplication } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@manosenaccion.org';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPassword123';
  const editorEmail =
    process.env.SEED_EDITOR_EMAIL ?? 'editor@manosenaccion.org';
  const editorPassword =
    process.env.SEED_EDITOR_PASSWORD ?? 'EditorPassword123';
  const newEditorEmail = 'new.editor@example.com';
  const newEditorPassword = 'NewEditorPassword123';
  const unknownId = '00000000-0000-0000-0000-000000000000';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  const login = (email: string, password: string) =>
    request(server).post('/auth/login').send({ email, password });

  const bearer = (token: string) => `Bearer ${token}`;

  const getToken = async (email: string, password: string): Promise<string> => {
    const response = await login(email, password).expect(200);
    return response.body.accessToken;
  };

  const createEditor = (
    token: string,
    overrides: Record<string, unknown> = {},
  ) =>
    request(server)
      .post('/users')
      .set('Authorization', bearer(token))
      .send({
        name: 'New Editor',
        email: newEditorEmail,
        password: newEditorPassword,
        ...overrides,
      });

  it('requires authentication and denies editors on every users route', async () => {
    const body = {
      name: 'New Editor',
      email: newEditorEmail,
      password: newEditorPassword,
    };

    await request(server).get('/users').expect(401);
    await request(server).post('/users').send(body).expect(401);

    const token = await getToken(editorEmail, editorPassword);

    await request(server)
      .get('/users')
      .set('Authorization', bearer(token))
      .expect(403);
    await request(server)
      .get(`/users/${unknownId}`)
      .set('Authorization', bearer(token))
      .expect(403);
    await request(server)
      .post('/users')
      .set('Authorization', bearer(token))
      .send(body)
      .expect(403);
    await request(server)
      .patch(`/users/${unknownId}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Hacked' })
      .expect(403);
    await request(server)
      .delete(`/users/${unknownId}`)
      .set('Authorization', bearer(token))
      .expect(403);
  });

  it('creates editors without exposing the password hash and allows them to sign in', async () => {
    const token = await getToken(adminEmail, adminPassword);

    const response = await createEditor(token, {
      name: '  Grace Hopper  ',
      email: ' GRACE@example.COM ',
      role: 'editor',
    }).expect(201);

    expect(response.body).toMatchObject({
      name: 'Grace Hopper',
      email: 'grace@example.com',
      role: 'editor',
    });
    expect(response.body).not.toHaveProperty('passwordHash');

    await login('grace@example.com', newEditorPassword).expect(200);
  });

  it('rejects admin roles and duplicate emails', async () => {
    const token = await getToken(adminEmail, adminPassword);

    await createEditor(token, {
      email: 'second.editor@example.com',
      role: 'admin',
    }).expect(400);

    await createEditor(token, {
      email: `  ${adminEmail.toUpperCase()}  `,
    }).expect(409);
  });

  it('lists and reads users without password hashes', async () => {
    const token = await getToken(adminEmail, adminPassword);

    const list = await request(server)
      .get('/users')
      .set('Authorization', bearer(token))
      .expect(200);

    expect(list.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ email: adminEmail, role: 'admin' }),
        expect.objectContaining({ email: editorEmail, role: 'editor' }),
      ]),
    );
    for (const user of list.body) {
      expect(user).not.toHaveProperty('passwordHash');
    }

    const editor = list.body.find(
      (user: { email: string }) => user.email === editorEmail,
    );
    const detail = await request(server)
      .get(`/users/${editor.id}`)
      .set('Authorization', bearer(token))
      .expect(200);

    expect(detail.body).toMatchObject({ id: editor.id, email: editorEmail });
    expect(detail.body).not.toHaveProperty('passwordHash');

    await request(server)
      .get('/users/not-a-uuid')
      .set('Authorization', bearer(token))
      .expect(400);
    await request(server)
      .get(`/users/${unknownId}`)
      .set('Authorization', bearer(token))
      .expect(404);
  });

  it('updates an editor, resets its password and revokes refresh tokens', async () => {
    const token = await getToken(adminEmail, adminPassword);
    const created = await createEditor(token).expect(201);
    const editorLogin = await login(newEditorEmail, newEditorPassword).expect(
      200,
    );

    const updated = await request(server)
      .patch(`/users/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({
        name: 'Grace Hopper',
        email: ' grace.hopper@example.com ',
        password: 'NewGracePassword456',
      })
      .expect(200);

    expect(updated.body).toMatchObject({
      id: created.body.id,
      name: 'Grace Hopper',
      email: 'grace.hopper@example.com',
      role: 'editor',
    });
    expect(updated.body).not.toHaveProperty('passwordHash');

    await login(newEditorEmail, newEditorPassword).expect(401);
    await login('grace.hopper@example.com', 'NewGracePassword456').expect(200);
    await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: editorLogin.body.refreshToken })
      .expect(401);
  });

  it('rejects empty updates, admin roles and duplicate emails on update', async () => {
    const token = await getToken(adminEmail, adminPassword);
    const created = await createEditor(token).expect(201);

    await request(server)
      .patch(`/users/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({})
      .expect(400);

    await request(server)
      .patch(`/users/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({ role: 'admin' })
      .expect(400);

    await request(server)
      .patch(`/users/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({ email: adminEmail })
      .expect(409);
  });

  it('refuses to edit or delete admins', async () => {
    const token = await getToken(adminEmail, adminPassword);
    const list = await request(server)
      .get('/users')
      .set('Authorization', bearer(token))
      .expect(200);
    const adminUser = list.body.find(
      (user: { role: string }) => user.role === 'admin',
    );

    await request(server)
      .patch(`/users/${adminUser.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Hacked' })
      .expect(403);

    await request(server)
      .delete(`/users/${adminUser.id}`)
      .set('Authorization', bearer(token))
      .expect(403);
  });

  it('deletes an editor and invalidates its credentials', async () => {
    const token = await getToken(adminEmail, adminPassword);
    const created = await createEditor(token).expect(201);
    const editorLogin = await login(newEditorEmail, newEditorPassword).expect(
      200,
    );

    await request(server)
      .delete(`/users/${created.body.id}`)
      .set('Authorization', bearer(token))
      .expect(204);

    await request(server)
      .get('/auth/me')
      .set('Authorization', bearer(editorLogin.body.accessToken))
      .expect(401);
    await login(newEditorEmail, newEditorPassword).expect(401);
    await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: editorLogin.body.refreshToken })
      .expect(401);

    await request(server)
      .delete(`/users/${created.body.id}`)
      .set('Authorization', bearer(token))
      .expect(404);
  });
});

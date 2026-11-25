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

  const signIn = async (email: string, password: string) => {
    const agent = request.agent(server);
    const response = await agent
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    return { agent, response };
  };

  const createEditor = (
    agent: ReturnType<typeof request.agent>,
    overrides: Record<string, unknown> = {},
  ) =>
    agent.post('/users').send({
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

    const { agent } = await signIn(editorEmail, editorPassword);

    await agent.get('/users').expect(403);
    await agent.get(`/users/${unknownId}`).expect(403);
    await agent.post('/users').send(body).expect(403);
    await agent
      .patch(`/users/${unknownId}`)
      .send({ name: 'Hacked' })
      .expect(403);
    await agent.delete(`/users/${unknownId}`).expect(403);
  });

  it('creates editors without exposing the password hash and allows them to sign in', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);

    const response = await createEditor(agent, {
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
    const { agent } = await signIn(adminEmail, adminPassword);

    await createEditor(agent, {
      email: 'second.editor@example.com',
      role: 'admin',
    }).expect(400);

    await createEditor(agent, {
      email: `  ${adminEmail.toUpperCase()}  `,
    }).expect(409);
  });

  it('lists and reads users without password hashes', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);

    const list = await agent.get('/users').expect(200);

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
    const detail = await agent.get(`/users/${editor.id}`).expect(200);

    expect(detail.body).toMatchObject({ id: editor.id, email: editorEmail });
    expect(detail.body).not.toHaveProperty('passwordHash');

    await agent.get('/users/not-a-uuid').expect(400);
    await agent.get(`/users/${unknownId}`).expect(404);
  });

  it('updates an editor, resets its password and closes its sessions', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);
    const created = await createEditor(agent).expect(201);
    const { agent: editorAgent } = await signIn(
      newEditorEmail,
      newEditorPassword,
    );

    const updated = await agent
      .patch(`/users/${created.body.id}`)
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

    await editorAgent.get('/auth/me').expect(401);
    await login(newEditorEmail, newEditorPassword).expect(401);
    await signIn('grace.hopper@example.com', 'NewGracePassword456');
  });

  it('rejects empty updates, admin roles and duplicate emails on update', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);
    const created = await createEditor(agent).expect(201);

    await agent.patch(`/users/${created.body.id}`).send({}).expect(400);

    await agent
      .patch(`/users/${created.body.id}`)
      .send({ role: 'admin' })
      .expect(400);

    await agent
      .patch(`/users/${created.body.id}`)
      .send({ email: adminEmail })
      .expect(409);
  });

  it('refuses to edit or delete admins', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);
    const list = await agent.get('/users').expect(200);
    const adminUser = list.body.find(
      (user: { role: string }) => user.role === 'admin',
    );

    await agent
      .patch(`/users/${adminUser.id}`)
      .send({ name: 'Hacked' })
      .expect(403);

    await agent.delete(`/users/${adminUser.id}`).expect(403);
  });

  it('deletes an editor and invalidates its credentials', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);
    const created = await createEditor(agent).expect(201);
    const { agent: editorAgent } = await signIn(
      newEditorEmail,
      newEditorPassword,
    );

    await agent.delete(`/users/${created.body.id}`).expect(204);

    await editorAgent.get('/auth/me').expect(401);
    await login(newEditorEmail, newEditorPassword).expect(401);
    await agent.delete(`/users/${created.body.id}`).expect(404);
  });

  it('resets a password with a temporary one and closes the editor sessions', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);
    const created = await createEditor(agent).expect(201);
    const { agent: editorAgent } = await signIn(
      newEditorEmail,
      newEditorPassword,
    );

    const response = await agent
      .post(`/users/${created.body.id}/password/reset`)
      .expect(200);

    expect(response.body.temporaryPassword).toEqual(expect.any(String));
    expect(response.body.temporaryPassword).toHaveLength(24);
    await editorAgent.get('/auth/me').expect(401);
    await login(newEditorEmail, newEditorPassword).expect(401);
    await login(
      newEditorEmail,
      response.body.temporaryPassword as string,
    ).expect(200);
  });
});

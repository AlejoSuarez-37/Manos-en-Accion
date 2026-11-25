import type { INestApplication } from '@nestjs/common';
import { Controller, Get } from '@nestjs/common';
import { PasswordHasher } from '@nestjs/authentication';
import { Can } from '@nestjs/authorization';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AdminPolicy } from '../src/authorization/admin.policy.js';
import { ContentPolicy } from '../src/authorization/content.policy.js';

@Controller('test/admin')
class AdminProbeController {
  @Get()
  @Can(AdminPolicy, 'manageEditors')
  check() {
    return { ok: true };
  }
}

@Controller('test/content')
class ContentProbeController {
  @Get()
  @Can(ContentPolicy, 'manage')
  check() {
    return { ok: true };
  }
}

describe('Authentication (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;

  const origins = (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@manosenaccion.org';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'AdminPassword123';
  const editorEmail =
    process.env.SEED_EDITOR_EMAIL ?? 'editor@manosenaccion.org';
  const editorPassword =
    process.env.SEED_EDITOR_PASSWORD ?? 'EditorPassword123';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [AdminProbeController, ContentProbeController],
    })
      .overrideProvider(PasswordHasher)
      .useValue(new PasswordHasher({ logN: 10 }))
      .compile();

    app = moduleFixture.createNestApplication();
    app.enableCors({ origin: origins, credentials: true });
    app.enableCsrfProtection({ trustedOrigins: origins });
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

  it('serves the public route without credentials', async () => {
    await request(server).get('/').expect(200).expect('Hello World!');
  });

  it('rejects invalid credentials without revealing the account', async () => {
    await login(adminEmail, 'wrong-password').expect(401);
    await login('unknown@manosenaccion.org', adminPassword).expect(401);
  });

  it('sets an HttpOnly session cookie and returns the current user', async () => {
    const { agent, response } = await signIn(adminEmail, adminPassword);

    expect(response.body).toMatchObject({ email: adminEmail, role: 'admin' });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');

    const cookie = String(response.headers['set-cookie']?.[0] ?? '');
    expect(cookie).toContain('sid=');
    expect(cookie).toContain('HttpOnly');

    const me = await agent.get('/auth/me').expect(200);
    expect(me.body).toMatchObject({ email: adminEmail, role: 'admin' });
  });

  it('requires a session and denies editors on admin routes', async () => {
    await request(server).get('/test/admin').expect(401);

    const { agent } = await signIn(editorEmail, editorPassword);
    await agent.get('/test/admin').expect(403);
    await agent.get('/test/content').expect(200);
  });

  it('allows admins on content and admin routes', async () => {
    const { agent } = await signIn(adminEmail, adminPassword);
    await agent.get('/test/admin').expect(200);
    await agent.get('/test/content').expect(200);
  });

  it('signs out and invalidates the session cookie', async () => {
    const { agent } = await signIn(editorEmail, editorPassword);
    await agent.get('/auth/me').expect(200);

    await agent.post('/auth/logout').expect(204);
    await agent.get('/auth/me').expect(401);
  });

  it('refuses a sign-in from another origin', async () => {
    await request(server)
      .post('/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: adminEmail, password: adminPassword })
      .expect(403);
  });

  it('changes the password, keeps the current session and closes the others', async () => {
    const newPassword = 'NewEditorPassword456';
    const { agent } = await signIn(editorEmail, editorPassword);
    const other = await signIn(editorEmail, editorPassword);

    await agent
      .patch('/auth/me/password')
      .send({ currentPassword: editorPassword, newPassword })
      .expect(200);

    await agent.get('/auth/me').expect(200);
    await other.agent.get('/auth/me').expect(401);
    await login(editorEmail, editorPassword).expect(401);
    await signIn(editorEmail, newPassword);
  });
});
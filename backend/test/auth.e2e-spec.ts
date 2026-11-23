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
    await app.init();
    server = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  const login = (email: string, password: string) =>
    request(server).post('/auth/login').send({ email, password });

  const bearer = (token: string) => `Bearer ${token}`;

  it('serves the public route without credentials', async () => {
    await request(server).get('/').expect(200).expect('Hello World!');
  });

  it('rejects invalid credentials without revealing the account', async () => {
    await login(adminEmail, 'wrong-password').expect(401);
    await login('unknown@manosenaccion.org', adminPassword).expect(401);
  });

  it('signs in and returns the current user', async () => {
    const { body } = await login(adminEmail, adminPassword).expect(200);

    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.refreshToken).toEqual(expect.any(String));
    expect(body.expiresIn).toEqual(expect.any(Number));

    const me = await request(server)
      .get('/auth/me')
      .set('Authorization', bearer(body.accessToken))
      .expect(200);

    expect(me.body).toMatchObject({
      email: adminEmail,
      role: 'admin',
    });
    expect(me.body).not.toHaveProperty('passwordHash');
  });

  it('requires a token and denies editors on admin routes', async () => {
    await request(server).get('/test/admin').expect(401);

    const editorLogin = await login(editorEmail, editorPassword).expect(200);

    await request(server)
      .get('/test/admin')
      .set('Authorization', bearer(editorLogin.body.accessToken))
      .expect(403);

    await request(server)
      .get('/test/content')
      .set('Authorization', bearer(editorLogin.body.accessToken))
      .expect(200);
  });

  it('allows admins on content and admin routes', async () => {
    const adminLogin = await login(adminEmail, adminPassword).expect(200);

    await request(server)
      .get('/test/admin')
      .set('Authorization', bearer(adminLogin.body.accessToken))
      .expect(200);

    await request(server)
      .get('/test/content')
      .set('Authorization', bearer(adminLogin.body.accessToken))
      .expect(200);
  });

  it('rotates refresh tokens and revokes the family on reuse', async () => {
    const { body } = await login(adminEmail, adminPassword).expect(200);

    const rotated = await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(200);

    await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(401);

    await request(server)
      .post('/auth/refresh')
      .send({ refreshToken: rotated.body.refreshToken })
      .expect(401);
  });

  it('revokes a refresh token on logout', async () => {
    const { body } = await login(editorEmail, editorPassword).expect(200);

    await request(server).post('/auth/logout').send({ refreshToken: body.refreshToken }).expect(204);

    await request(server).post('/auth/refresh').send({ refreshToken: body.refreshToken }).expect(401);
  });

  it('changes the password and invalidates old credentials and refresh tokens', async () => {
    const newPassword = 'NewEditorPassword456';
    const { body } = await login(editorEmail, editorPassword).expect(200);

    await request(server)
      .patch('/auth/me/password')
      .set('Authorization', bearer(body.accessToken))
      .send({ currentPassword: editorPassword, newPassword })
      .expect(200);

    await login(editorEmail, editorPassword).expect(401);
    await login(editorEmail, newPassword).expect(200);
    await request(server).post('/auth/refresh').send({ refreshToken: body.refreshToken }).expect(401);
  });
});

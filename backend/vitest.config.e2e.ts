import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    env: {
      NODE_ENV: 'test',
      CORS_ORIGIN: 'http://localhost:3000',
      JWT_SECRET: 'test-only-jwt-secret-of-at-least-32-bytes',
      JWT_ISSUER: 'manos-en-accion-api',
      JWT_AUDIENCE: 'manos-en-accion-admin',
      ACCESS_TOKEN_TTL: '15m',
      REFRESH_TOKEN_TTL: '7d',
      REFRESH_TOKEN_ABSOLUTE_TTL: '30d',
      SEED_ADMIN_EMAIL: 'admin@manosenaccion.org',
      SEED_ADMIN_PASSWORD: 'AdminPassword123',
      SEED_EDITOR_EMAIL: 'editor@manosenaccion.org',
      SEED_EDITOR_PASSWORD: 'EditorPassword123',
    },
  },
});

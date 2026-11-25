import { existsSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
      TEST_DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/manos_en_accion_test',
      SESSION_IDLE_TTL: process.env.SESSION_IDLE_TTL ?? '1d',
      SESSION_ABSOLUTE_TTL: process.env.SESSION_ABSOLUTE_TTL ?? '7d',
      SEED_ADMIN_EMAIL:
        process.env.SEED_ADMIN_EMAIL ?? 'admin@manosenaccion.org',
      SEED_ADMIN_PASSWORD:
        process.env.SEED_ADMIN_PASSWORD ?? 'AdminPassword123',
      SEED_EDITOR_EMAIL:
        process.env.SEED_EDITOR_EMAIL ?? 'editor@manosenaccion.org',
      SEED_EDITOR_PASSWORD:
        process.env.SEED_EDITOR_PASSWORD ?? 'EditorPassword123',
    },
  },
});

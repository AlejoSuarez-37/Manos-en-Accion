import { z } from 'zod';

const durationSchema = z.string().regex(/^\d+(?:ms|s|m|h|d|w)$/);

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    JWT_ISSUER: z.string().min(1),
    JWT_AUDIENCE: z.string().min(1),
    ACCESS_TOKEN_TTL: durationSchema.default('15m'),
    REFRESH_TOKEN_TTL: durationSchema.default('7d'),
    REFRESH_TOKEN_ABSOLUTE_TTL: durationSchema.default('30d'),
    DATABASE_URL: z.url().optional(),
    TEST_DATABASE_URL: z.url().optional(),
    SEED_ADMIN_EMAIL: z.email(),
    SEED_ADMIN_PASSWORD: z.string().min(12).max(128),
    SEED_EDITOR_EMAIL: z.email().optional(),
    SEED_EDITOR_PASSWORD: z.string().min(12).max(128).optional(),
  })
  .passthrough()
  .superRefine((env, context) => {
    if (env.NODE_ENV === 'test' && !env.TEST_DATABASE_URL) {
      context.addIssue({
        code: 'custom',
        message: 'TEST_DATABASE_URL is required when NODE_ENV is test',
      });
    }

    if (env.NODE_ENV !== 'test' && !env.DATABASE_URL) {
      context.addIssue({
        code: 'custom',
        message: 'DATABASE_URL is required',
      });
    }

    if (Boolean(env.SEED_EDITOR_EMAIL) !== Boolean(env.SEED_EDITOR_PASSWORD)) {
      context.addIssue({
        code: 'custom',
        message:
          'SEED_EDITOR_EMAIL and SEED_EDITOR_PASSWORD must be set together',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

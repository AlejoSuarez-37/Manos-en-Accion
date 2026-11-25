import { z } from 'zod';

const durationSchema = z.string().regex(/^\d+(?:ms|s|m|h|d|w)$/);

const optionalNonEmpty = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).optional(),
);

const folderSchema = z.preprocess(
  (value) => (value === '' ? undefined : value),
  z.string().min(1).default('manos-en-accion'),
);

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CORS_ORIGIN: z.string().min(1),
    SESSION_IDLE_TTL: durationSchema.default('1d'),
    SESSION_ABSOLUTE_TTL: durationSchema.default('7d'),
    DATABASE_URL: z.url().optional(),
    TEST_DATABASE_URL: z.url().optional(),
    SEED_ADMIN_EMAIL: z.email(),
    SEED_ADMIN_PASSWORD: z.string().min(12).max(128),
    SEED_EDITOR_EMAIL: z.email().optional(),
    SEED_EDITOR_PASSWORD: z.string().min(12).max(128).optional(),
    CLOUDINARY_CLOUD_NAME: optionalNonEmpty,
    CLOUDINARY_API_KEY: optionalNonEmpty,
    CLOUDINARY_API_SECRET: optionalNonEmpty,
    CLOUDINARY_FOLDER: folderSchema,
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

    if (env.NODE_ENV !== 'test') {
      for (const name of [
        'CLOUDINARY_CLOUD_NAME',
        'CLOUDINARY_API_KEY',
        'CLOUDINARY_API_SECRET',
      ] as const) {
        if (!env[name]) {
          context.addIssue({
            code: 'custom',
            path: [name],
            message: `${name} es obligatorio fuera del entorno de pruebas`,
          });
        }
      }
    }
    if (
      env.NODE_ENV === 'production' &&
      /change[-_]?me|changethis|placeholder/i.test(env.SEED_ADMIN_PASSWORD)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'SEED_ADMIN_PASSWORD must not be a placeholder in production',
      });

    }
  });

export type Env = z.infer<typeof envSchema>;
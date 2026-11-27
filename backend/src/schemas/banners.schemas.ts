import { z } from 'zod';

const positionSchema = z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.coerce.number().int().positive().max(100_000).optional(),
);

export const updateBannerSchema = z.object({
    position: positionSchema,
});

export const bannerIdParamSchema = z.uuid();

export type UpdateBannerDto = z.infer<typeof updateBannerSchema>;

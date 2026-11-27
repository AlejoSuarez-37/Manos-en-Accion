import { z } from 'zod';
import { sponsorCategories } from '../sponsors/entities/sponsor.entity.js';

const nameSchema = z.string().trim().min(1).max(120);
const categorySchema = z.enum(sponsorCategories);
const websiteUrlSchema = z.preprocess(
    (value) => (value === '' ? null : value), z
        .url()
        .trim()
        .max(2048)
        .refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), {
            message: 'Solo se permiten URLs http o https',
        })
        .nullable()
        .optional(),
);

export const createSponsorSchema = z.object({
    name: nameSchema,
    category: categorySchema,
    websiteUrl: websiteUrlSchema,
});

export const updateSponsorSchema = z.object({
    name: nameSchema.optional(),
    category: categorySchema.optional(),
    websiteUrl: websiteUrlSchema,
});

export const sponsorIdParamSchema = z.uuid();

export const listSponsorsQuerySchema = z.object({
    category: categorySchema.optional(),
});

export type CreateSponsorDto = z.infer<typeof createSponsorSchema>;
export type UpdateSponsorDto = z.infer<typeof updateSponsorSchema>;
export type ListSponsorsQueryDto = z.infer<typeof listSponsorsQuerySchema>;
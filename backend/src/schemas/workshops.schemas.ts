import { z } from 'zod';

const focusAreaNameSchema = z.string().trim().min(1).max(120);
const focusAreaDescriptionSchema = z.string().trim().max(1000);
const titleSchema = z.string().trim().min(1).max(200);
const descriptionSchema = z.string().trim().min(1).max(2000);
const pdfNameSchema = z.string().trim().min(1).max(120).optional();

export const createFocusAreaSchema = z.object({
  name: focusAreaNameSchema,
  description: focusAreaDescriptionSchema.optional(),
});

export const updateFocusAreaSchema = z
  .object({
    name: focusAreaNameSchema.optional(),
    description: focusAreaDescriptionSchema.optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo',
  });

export const createWorkshopSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  focusAreaId: z.uuid(),
  pdfName: pdfNameSchema,
});

export const updateWorkshopSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    focusAreaId: z.uuid().optional(),
    pdfName: pdfNameSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo',
  });

export const listWorkshopsQuerySchema = z.object({
  focusAreaId: z.uuid().optional(),
});

export const focusAreaIdParamSchema = z.uuid();
export const workshopIdParamSchema = z.uuid();

export type CreateFocusAreaDto = z.infer<typeof createFocusAreaSchema>;
export type UpdateFocusAreaDto = z.infer<typeof updateFocusAreaSchema>;
export type CreateWorkshopDto = z.infer<typeof createWorkshopSchema>;
export type UpdateWorkshopDto = z.infer<typeof updateWorkshopSchema>;
export type ListWorkshopsQueryDto = z.infer<typeof listWorkshopsQuerySchema>;

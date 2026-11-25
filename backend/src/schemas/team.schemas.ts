import { z } from 'zod';

const nameSchema = z.string().trim().min(1).max(120);
const roleSchema = z.string().trim().min(1).max(120);
const bioSchema = z.string().trim().max(1000).optional();

export const createTeamMemberSchema = z.object({
  name: nameSchema,
  role: roleSchema,
  bio: bioSchema,
});

export const updateTeamMemberSchema = z
  .object({
    name: nameSchema.optional(),
    role: roleSchema.optional(),
    bio: bioSchema,
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debe enviar al menos un campo',
  });

export const teamMemberIdParamSchema = z.uuid();

export type CreateTeamMemberDto = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberDto = z.infer<typeof updateTeamMemberSchema>;

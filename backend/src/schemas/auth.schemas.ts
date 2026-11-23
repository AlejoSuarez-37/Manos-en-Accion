import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(4096),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(4096),
  newPassword: z.string().min(12).max(128),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

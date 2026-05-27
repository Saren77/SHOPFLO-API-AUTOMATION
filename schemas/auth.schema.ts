import { z } from 'zod';

export const LoginPayloadSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const LoginSuccessSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, 'JWT format'),
});

export type LoginPayload = z.infer<typeof LoginPayloadSchema>;
export type LoginSuccess = z.infer<typeof LoginSuccessSchema>;

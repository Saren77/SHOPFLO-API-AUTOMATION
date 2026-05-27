import { z } from 'zod';

export const CartProductSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const CartSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  date: z.string().min(1),
  products: z.array(CartProductSchema),
  __v: z.number().int().optional(),
});

export const CartListSchema = z.array(CartSchema);

export const CartCreatePayloadSchema = z.object({
  userId: z.number().int().positive(),
  date: z.string().min(1),
  products: z.array(CartProductSchema).min(1),
});

export const CartCreateResponseSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive().optional(),
  date: z.string().optional(),
  products: z.array(CartProductSchema).optional(),
});

export type Cart = z.infer<typeof CartSchema>;
export type CartProduct = z.infer<typeof CartProductSchema>;
export type CartCreatePayload = z.infer<typeof CartCreatePayloadSchema>;

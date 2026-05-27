import type { CartCreatePayload } from '../schemas/cart.schema';

export const validCredentials = {
  username: 'mor_2314',
  password: '83r5^_',
} as const;

export const invalidCredentials = {
  username: 'definitely_not_a_user',
  password: 'wrong_password',
} as const;

export const validCartPayload: CartCreatePayload = {
  userId: 5,
  date: '2020-02-03',
  products: [
    { productId: 5, quantity: 1 },
    { productId: 1, quantity: 5 },
  ],
};

export const validCartUpdatePayload: CartCreatePayload = {
  userId: 3,
  date: '2019-12-10',
  products: [{ productId: 1, quantity: 3 }],
};

// IDs we use across data-driven scenarios (must exist in seed data, 1..10)
export const parameterizedCartIds = [1, 4, 7] as const;

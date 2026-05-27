import { test, expect } from '@playwright/test';
import { CartSchema } from '../../schemas/cart.schema';
import { parameterizedCartIds } from '../../fixtures/test-data';
import { parseJson } from '../../fixtures/helpers';

test.describe('GET /carts/{id} — parameterized across multiple cart IDs', () => {
  for (const cartId of parameterizedCartIds) {
    test(`cart ${cartId} returns 200 and a schema-valid body`, async ({ request }) => {
      const response = await request.get(`/carts/${cartId}`);

      expect(response.status()).toBe(200);
      const cart = await parseJson(response, CartSchema);

      expect(cart.id).toBe(cartId);
      expect(cart.products.length).toBeGreaterThan(0);
      // Date must be parseable — fakestoreapi uses ISO 8601 on seed data.
      expect(Number.isNaN(Date.parse(cart.date))).toBe(false);
    });
  }
});

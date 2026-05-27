import { test, expect } from '@playwright/test';
import { CartListSchema, CartSchema } from '../../schemas/cart.schema';
import { expectJsonContentType, parseJson } from '../../fixtures/helpers';

test.describe('GET /carts — read', () => {
  test('GET /carts/1 returns the expected shape and field values', async ({ request }) => {
    const response = await request.get('/carts/1');

    expect(response.status()).toBe(200);
    await expectJsonContentType(response);

    const cart = await parseJson(response, CartSchema);
    expect(cart.id).toBe(1);
    expect(cart.userId).toBe(1);
    expect(cart.products.length).toBeGreaterThan(0);
    for (const p of cart.products) {
      expect(p.productId).toBeGreaterThan(0);
      expect(p.quantity).toBeGreaterThan(0);
    }
  });

  test('GET /carts returns a schema-valid array of carts', async ({ request }) => {
    const response = await request.get('/carts');

    expect(response.status()).toBe(200);
    await expectJsonContentType(response);

    const carts = await parseJson(response, CartListSchema);
    // Seed data is 10 carts at time of writing — assert lower bound, not exact,
    // so the test doesn't get noisy if they reseed.
    expect(carts.length).toBeGreaterThanOrEqual(7);
  });

  test('GET /carts/abc returns 400 with a JSON error body', async ({ request }) => {
    const response = await request.get('/carts/abc');

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'error' });
    expect(body.message).toMatch(/cart id/i);

    // Note: GET /carts/9999 and /carts/-1 silently return `200 + null` instead
    // of erroring. Path-param validation is inconsistent — only non-numeric
    // strings get the 400 treatment.
  });
});

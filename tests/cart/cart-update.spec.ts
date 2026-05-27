import { test, expect } from '@playwright/test';
import { CartCreateResponseSchema } from '../../schemas/cart.schema';
import { validCartUpdatePayload } from '../../fixtures/test-data';
import { parseJson } from '../../fixtures/helpers';

test.describe('PUT /carts/{id} — update cart', () => {
  test('valid payload returns 200, echoes the update, but does NOT persist (bug)', async ({
    request,
  }) => {
    const response = await request.put('/carts/7', { data: validCartUpdatePayload });

    expect(response.status()).toBe(200);
    const body = await parseJson(response, CartCreateResponseSchema);
    expect(body.id).toBe(7);
    expect(body.userId).toBe(validCartUpdatePayload.userId);
    expect(body.date).toBe(validCartUpdatePayload.date);
    expect(body.products).toEqual(validCartUpdatePayload.products);

    // BUG (fakestoreapi): PUT returns 200 with the new payload echoed back,
    // but the server never writes it. A subsequent GET returns the original
    // seed data (cart 7 has userId=8, not the userId=3 we just PUT).
    const fetched = await (await request.get('/carts/7')).json();
    expect(fetched.userId).not.toBe(validCartUpdatePayload.userId);
  });

  test('malformed JSON returns 400', async ({ request }) => {
    const response = await request.put('/carts/7', {
      headers: { 'Content-Type': 'application/json' },
      data: 'not json at all',
    });
    expect(response.status()).toBe(400);
  });
});

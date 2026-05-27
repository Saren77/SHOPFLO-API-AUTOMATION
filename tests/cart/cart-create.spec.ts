import { test, expect } from '@playwright/test';
import { CartCreateResponseSchema } from '../../schemas/cart.schema';
import { validCartPayload } from '../../fixtures/test-data';
import { parseJson } from '../../fixtures/helpers';

test.describe('POST /carts — create cart', () => {
  test('valid payload returns 201 with an id, echoes fields, but does NOT persist (bug)', async ({
    request,
  }) => {
    const response = await request.post('/carts', { data: validCartPayload });

    expect(response.status()).toBe(201);
    const body = await parseJson(response, CartCreateResponseSchema);

    expect(body.id).toBeGreaterThan(0);
    expect(body.userId).toBe(validCartPayload.userId);
    expect(body.date).toBe(validCartPayload.date);
    expect(body.products).toEqual(validCartPayload.products);

    // BUG (fakestoreapi): POST returns a new id but the cart is NOT persisted.
    // GET /carts/{newId} returns `null` afterwards. The follow-up assertion
    // documents the bug so this test fails the day they wire up writes.
    const fetched = await request.get(`/carts/${body.id}`);
    expect(fetched.status()).toBe(200);
    expect(await fetched.json()).toBeNull();
  });

  test('malformed JSON returns 400', async ({ request }) => {
    // Only validation that actually works on this endpoint — everything else
    // (empty body, wrong content-type, missing fields) is silently accepted.
    const response = await request.post('/carts', {
      headers: { 'Content-Type': 'application/json' },
      data: '{this is not valid json',
    });
    expect(response.status()).toBe(400);
  });
});

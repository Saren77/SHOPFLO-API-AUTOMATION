import { test, expect } from '@playwright/test';
import { CartSchema } from '../../schemas/cart.schema';
import { parseJson } from '../../fixtures/helpers';

test.describe('DELETE /carts/{id} — delete cart', () => {
  test('valid ID returns 200 with the deleted cart in body, but does NOT persist (bug)', async ({
    request,
  }) => {
    const response = await request.delete('/carts/6');

    expect(response.status()).toBe(200);
    // The response body is the cart that "was" deleted — useful for clients
    // wanting to confirm what was removed.
    const cart = await parseJson(response, CartSchema);
    expect(cart.id).toBe(6);

    // BUG (fakestoreapi): DELETE returns 200 with the deleted-cart payload but
    // the resource is still fetchable afterwards. Same fake-write pattern as PUT.
    const afterGet = await request.get('/carts/6');
    expect(afterGet.status()).toBe(200);
    const stillThere = await afterGet.json();
    expect(stillThere).not.toBeNull();
    expect(stillThere.id).toBe(6);
  });

  test('string ID returns 400 with a JSON error body', async ({ request }) => {
    const response = await request.delete('/carts/abc');

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body).toMatchObject({ status: 'error' });
  });
});

import { test, expect } from '@playwright/test';
import { LoginSuccessSchema } from '../../schemas/auth.schema';
import { invalidCredentials, validCredentials } from '../../fixtures/test-data';
import { parseJson } from '../../fixtures/helpers';

test.describe('POST /auth/login', () => {
  test('valid credentials return a JWT-shaped token', async ({ request }) => {
    const response = await request.post('/auth/login', { data: validCredentials });

    // BUG (fakestoreapi): login returns 201 Created — a real API uses 200 OK
    // for login since no resource is created. Codifying actual behavior.
    expect(response.status()).toBe(201);
    const body = await parseJson(response, LoginSuccessSchema);

    // Decode the JWT payload to confirm it actually references the user we
    // logged in as — "token exists" is not enough.
    const payloadSegment = body.token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf-8'));
    expect(decoded.user).toBe(validCredentials.username);
    expect(typeof decoded.sub).toBe('number');
  });

  test('invalid credentials return 401 with a plain-text body (bug — should be JSON)', async ({
    request,
  }) => {
    const response = await request.post('/auth/login', { data: invalidCredentials });

    expect(response.status()).toBe(401);

    // BUG (fakestoreapi): error body is plain text "username or password is
    // incorrect" instead of JSON. A real API returns { error, message }.
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('application/json');
    expect(await response.text()).toMatch(/incorrect/i);
  });
});

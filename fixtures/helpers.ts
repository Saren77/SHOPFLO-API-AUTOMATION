import type { APIResponse } from '@playwright/test';
import { expect } from '@playwright/test';
import type { ZodSchema } from 'zod';

/**
 * Parse a response body with a zod schema and surface the validation error in
 * the test output if it fails. We intentionally do NOT swallow the error — a
 * shape mismatch should fail loudly with the offending data visible.
 */
export async function parseJson<T>(response: APIResponse, schema: ZodSchema<T>): Promise<T> {
  const body = await response.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new Error(
      `Schema validation failed for ${response.url()} (status ${response.status()}):\n` +
        `${JSON.stringify(result.error.issues, null, 2)}\n` +
        `Body received:\n${JSON.stringify(body, null, 2)}`,
    );
  }
  return result.data;
}

export async function expectJsonContentType(response: APIResponse): Promise<void> {
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, `expected JSON content-type, got "${contentType}"`).toContain('application/json');
}

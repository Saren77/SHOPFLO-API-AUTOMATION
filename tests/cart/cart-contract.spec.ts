import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import contract from '../contracts/cart.contract.json';

/**
 * CONTRACT TEST — chose a hand-authored JSON Schema (in tests/contracts/) over
 * Playwright's toMatchSnapshot for these reasons:
 *
 *  1. toMatchSnapshot captures the entire response body including volatile data
 *     (ids, dates, specific quantities). Any seed-data change triggers a noisy
 *     diff that doesn't represent a real contract violation.
 *  2. A hand-authored JSON Schema encodes ONLY what we care about — required
 *     fields, types, and rejection of unknown keys. It's reviewable in a PR.
 *  3. `--update-snapshots` is one keystroke and silently rewrites the source of
 *     truth. Editing cart.contract.json is a deliberate, code-reviewed change.
 *  4. The schema file doubles as documentation for downstream API consumers —
 *     a snapshot file does not.
 *
 * Tradeoff: a schema only checks structure, not specific values. We do value-
 * level assertions in cart-read.spec.ts where they belong (per-cart data).
 */

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(contract);

test.describe('Contract test — GET /carts/1', () => {
  test('response matches the frozen JSON Schema contract', async ({ request }) => {
    const response = await request.get('/carts/1');
    expect(response.status()).toBe(200);

    const body = await response.json();
    const valid = validate(body);

    if (!valid) {
      throw new Error(
        `Cart contract drift detected. If this drift is intentional, update ` +
          `tests/contracts/cart.contract.json deliberately.\n\n` +
          `Validation errors:\n${JSON.stringify(validate.errors, null, 2)}\n\n` +
          `Body received:\n${JSON.stringify(body, null, 2)}`,
      );
    }
  });
});

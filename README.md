# Fakestore Cart API — Playwright Test Suite

A focused **15-test** API suite for the Cart endpoints on [fakestoreapi.com](https://fakestoreapi.com), built with `@playwright/test` (request fixture, no browser). Every test is intentional — no padding, no aspirational coverage.

## Framework choice — why Playwright

I'd pick Playwright on a team already using it for E2E. Same runner, same reporter, same parallelism model, one CI job to maintain. The `request` fixture gives you base URL, default headers, cookies, and HAR recording for free, plus first-class TypeScript with zero ceremony.

**Tradeoffs vs alternatives:**

| Tool         | When I'd reach for it instead                                                                |
| ------------ | -------------------------------------------------------------------------------------------- |
| supertest    | Pure-Node app under test, want in-process speed and direct Express handle.                   |
| rest-assured | Java shop, BDD-style assertions, Maven/Gradle pipelines.                                     |
| k6           | Load / perf testing — Playwright is the wrong tool for sustained RPS.                        |
| Postman/Newman | Non-engineers also editing the suite, or want a GUI for ad-hoc exploration.                |

Playwright loses on raw throughput for load and adds a heavier dependency than supertest, but for a functional API regression suite the ergonomics are very hard to beat — and the shared toolchain with E2E pays off immediately at the team level.

## What's in the suite (15 tests total)

```
.
├── playwright.config.ts             # baseURL, parallel, retries, html+list reporters
├── package.json
├── tsconfig.json
├── schemas/                         # zod schemas (single source of truth for shapes)
│   ├── cart.schema.ts
│   └── auth.schema.ts
├── fixtures/                        # test data + small helpers (no setup magic)
│   ├── test-data.ts
│   └── helpers.ts
└── tests/
    ├── auth/
    │   └── auth.spec.ts             # 2 — valid login (JWT decode), invalid login
    ├── cart/
    │   ├── cart-create.spec.ts      # 2 — POST happy (with persistence bug), malformed JSON
    │   ├── cart-read.spec.ts        # 3 — GET single, GET list, string-ID 400
    │   ├── cart-update.spec.ts      # 2 — PUT happy (with persistence bug), malformed JSON
    │   ├── cart-delete.spec.ts      # 2 — DELETE happy (with persistence bug), string-ID 400
    │   ├── cart-data-driven.spec.ts # 3 — GET /carts/{id} parameterized over [1, 4, 7]
    │   └── cart-contract.spec.ts    # 1 — ajv vs frozen JSON Schema
    └── contracts/
        └── cart.contract.json       # hand-authored JSON Schema (draft-07)
```

**Coverage matrix against the brief:**

| Requirement                             | Where                                                  |
| --------------------------------------- | ------------------------------------------------------ |
| Cart CRUD (POST/GET/PUT/DELETE)         | `cart-create`, `cart-read`, `cart-update`, `cart-delete` |
| Positive cases                          | Happy-path test in every CRUD file                     |
| Negative cases                          | One per CRUD verb (the most informative one)           |
| Authentication                          | `auth.spec.ts` — valid + invalid login                 |
| Response schema validation              | Every GET parses with zod (`CartSchema`/`CartListSchema`) |
| Data-driven (one scenario, 3+ IDs)      | `cart-data-driven.spec.ts` — for-loop over 3 ids       |
| Schema/contract snapshot test           | `cart-contract.spec.ts` + `tests/contracts/cart.contract.json` |

## How to run

```bash
npm install
npx playwright test                 # run all 15
npx playwright test tests/cart      # cart only
npx playwright test --grep contract # contract gate only
npm run report                      # open the HTML report
```

CI mode (`CI=1`) enables 1 retry, 4 workers, and trace-on-failure. Locally retries are off — a flake locally is a bug to fix, not papered over.

Override the host without code changes:

```bash
BASE_URL=https://staging.example.com npx playwright test
```

## CI

`.github/workflows/test.yml` runs the full suite on every push (and supports manual re-run via `workflow_dispatch`). Steps:

1. Checkout + Node 20 with npm cache.
2. `npm ci` — deterministic install from `package-lock.json`.
3. `npm run typecheck` — fast-fails before tests if TS is broken.
4. `npx playwright test` with `CI=true` (1 retry, 4 workers, trace-on-failure per `playwright.config.ts`).
5. Upload `playwright-report/` as an artifact, kept 14 days, regardless of pass/fail — clickable trace links survive even when the runner is gone.

No `npx playwright install` step on purpose — this is an API-only suite, no browsers needed, saves ~30s per run.

## Notes on fakestoreapi quirks (documented, not hidden)

This API has a lot of bugs. Rather than mock them away, each is asserted as-is with a `BUG` comment, so the test fails the day the API is fixed. Highlights folded into the suite:

- `POST/PUT/DELETE` all return success but **don't persist** — each happy-path test includes a follow-up GET that proves this.
- Login returns `201`, not `200` (no resource was created — it's a wrong status code).
- Invalid login returns `401` with a **plain-text** body, not JSON.
- Path-param validation is inconsistent: `/carts/abc` returns `400`, but `/carts/9999` and `/carts/-1` silently return `200 + null`.

## Extension plan

**Parallelisation.** The config sets `fullyParallel: true` with 4 workers in CI. Next step is sharding across CI runners — Playwright supports `--shard=1/4` natively, so the suite splits across 4 GitHub Actions jobs and the HTML reports merge with `npx playwright merge-reports`. Overkill at 15 tests; pays off above ~200.

**Reporting.** HTML report is fine locally. For CI, publish the `playwright-report/` folder as a GitHub Actions artifact (`actions/upload-artifact`) so every failed run has a clickable trace. If the org already runs Allure for other suites, swap in the community Allure reporter — single line change in `playwright.config.ts`.

**What I'd add next** (in priority order):

1. **Contract test in the CI gate** — run `cart-contract.spec.ts` on every PR plus nightly against staging, with Slack alerts on drift. The frozen JSON Schema is one of the more durable assets in this repo.
2. **Env-based config** — wire `BASE_URL` + per-env credentials through a single `env.ts` so staging/prod runs differ only by `--project=staging`.
3. **Perf smoke with k6** — wrong tool for functional, right tool for "did p95 of GET /carts regress." 30-second smoke per PR, fail above a threshold.
4. **Auth-enforced spec when auth becomes real** — every cart spec gains a 401 case for missing/expired/forged tokens. Today auth isn't enforced so those tests would only assert "no effect," which isn't worth the line count.
5. **Test data lifecycle** — when fakestoreapi is replaced with a real backend, add `globalSetup`/`globalTeardown` to seed a per-run user + cart, so the persistence-bug assertions flip to actual round-trip assertions.

## Design choices worth calling out

- **Zod for runtime shape + TS inference.** One schema, two jobs. `z.infer<typeof CartSchema>` is the same type the test code consumes — schema change = type error at compile time.
- **JSON Schema for the contract test, not `toMatchSnapshot`.** Rationale lives in the comment at the top of `tests/cart/cart-contract.spec.ts`. Short version: snapshots capture volatile data and `--update-snapshots` silently rewrites the source of truth.
- **No global setup, no shared `request` instance.** Per-test `request` fixture everywhere. Auth tests login inline — caching a token for performance on an unauth'd endpoint adds shared state for zero benefit.
- **Failures are loud.** `parseJson` throws with the offending body inline so you don't need to retrieve traces from CI to diagnose. No `.toBeTruthy()` on responses, no error-swallowing try/catch.

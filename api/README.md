# MYNIX API

NestJS backend for the MYNIX store: products, orders, payments (OnePay, cash on
delivery, bank transfer) and customer accounts. Runs as a Docker container
(AWS App Runner, Mumbai) next to the Supabase Postgres database; the Next.js
site in the repo root calls it.

## Run locally

```bash
cp .env.example .env          # fill in DATABASE_URL and SUPABASE_URL
npm install                   # needs npm 11+ (npx npm@11 install) — npm 10 hits a resolver bug
npm run start:dev             # http://localhost:4000, API docs at /docs
```

## Endpoints so far

| Method | Path | Access |
| --- | --- | --- |
| GET | `/health` | public — database check for the load balancer |
| GET | `/v1/products` | public — live products in display order |
| GET | `/v1/products/:id` | public |
| GET | `/v1/me` | signed in — who the API sees you as |

Admin routes use `@AdminOnly()`: a valid Supabase token **with two-step
sign-in (aal2)** and a row in `admins`, matching the database rules.

## Tests

```bash
docker run -d --name mynix-api-testdb -e POSTGRES_PASSWORD=test -e POSTGRES_DB=mynix_test -p 54329:5432 postgres:17-alpine
npm test            # unit tests
npm run test:e2e    # whole app against the throwaway database, with locally signed tokens
```

## Docker

```bash
docker build -t mynix-api .
docker run -p 4000:4000 --env-file .env mynix-api
```

The image runs as a non-root user, contains only production dependencies,
and has a `HEALTHCHECK` on `/health`. Swagger docs are disabled when
`NODE_ENV=production`.

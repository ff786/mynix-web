import { Controller, Get, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type CryptoKey, type JWK } from 'jose';
import postgres from 'postgres';
import request from 'supertest';
import { AdminOnly } from '../src/auth/guards.js';
import { JWKS } from '../src/auth/token-verifier.js';

/**
 * Runs the real app against a throwaway Postgres (TEST_DATABASE_URL) with
 * tokens signed by a local test key instead of Supabase's.
 */
const DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgres://postgres:test@localhost:54329/mynix_test';
const SUPABASE_URL = 'https://test-project.supabase.co';
const ISSUER = `${SUPABASE_URL}/auth/v1`;

const ADMIN_ID = '11111111-1111-4111-8111-111111111111';
const CUSTOMER_ID = '22222222-2222-4222-8222-222222222222';
const LIVE_ID = '33333333-3333-4333-8333-333333333333';
const HIDDEN_ID = '44444444-4444-4444-8444-444444444444';

@Controller('test-admin')
class TestAdminController {
  @Get()
  @AdminOnly()
  ok() {
    return { ok: true };
  }
}

describe('MYNIX API (e2e)', () => {
  let app: INestApplication;
  let sql: postgres.Sql;
  let key: CryptoKey;
  let otherKey: CryptoKey;

  const token = (claims: Record<string, unknown>, opts: { key?: CryptoKey; issuer?: string; expires?: string } = {}) =>
    new SignJWT({ aal: 'aal1', ...claims })
      .setProtectedHeader({ alg: 'ES256', kid: 'test' })
      .setIssuer(opts.issuer ?? ISSUER)
      .setAudience('authenticated')
      .setIssuedAt()
      .setExpirationTime(opts.expires ?? '5m')
      .sign(opts.key ?? key);

  beforeAll(async () => {
    Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL, SUPABASE_URL, CORS_ORIGINS: 'https://shop.example' });

    sql = postgres(DATABASE_URL, { onnotice: () => {} });
    await sql.unsafe(`
      drop table if exists admins, products;
      create table admins (user_id uuid primary key, created_at timestamptz not null default now());
      create table products (
        id uuid primary key default gen_random_uuid(), sku text not null unique, name text not null,
        category text not null, description text not null default '', features text[] not null default '{}',
        variants text[] not null default '{}', image text, flagship boolean not null default false,
        published boolean not null default true, sort_order integer not null default 0,
        created_at timestamptz not null default now(), updated_at timestamptz not null default now());
      insert into admins (user_id) values ('${ADMIN_ID}');
      insert into products (id, sku, name, category, published, sort_order) values
        ('${LIVE_ID}', 'MNX-LIVE', 'Live torch', 'torches', true, 10),
        ('${HIDDEN_ID}', 'MNX-HIDDEN', 'Hidden loupe', 'optical', false, 20);
    `);

    const pair = await generateKeyPair('ES256');
    key = pair.privateKey;
    ({ privateKey: otherKey } = await generateKeyPair('ES256'));
    // Only `key`'s public half is trusted — tokens signed with `otherKey` must fail.
    const jwk: JWK = { ...(await exportJWK(pair.publicKey)), kid: 'test' };

    const { AppModule } = await import('../src/app.module.js');
    const { configureApp } = await import('../src/app.setup.js');
    const moduleRef = await Test.createTestingModule({ imports: [AppModule], controllers: [TestAdminController] })
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [jwk] }))
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await sql?.end();
  });

  const http = () => request(app.getHttpServer());

  describe('health', () => {
    it('reports the database as reachable', () => http().get('/health').expect(200, { status: 'ok', database: 'ok' }));
  });

  describe('products', () => {
    it('lists only live products, without internal fields', async () => {
      const res = await http().get('/v1/products').expect(200);
      expect(res.body.map((p: { sku: string }) => p.sku)).toEqual(['MNX-LIVE']);
      expect(res.body[0]).not.toHaveProperty('published');
      expect(res.body[0]).not.toHaveProperty('createdAt');
    });

    it('returns a live product by id', async () => {
      const res = await http().get(`/v1/products/${LIVE_ID}`).expect(200);
      expect(res.body.name).toBe('Live torch');
    });

    it('hides unpublished products', () => http().get(`/v1/products/${HIDDEN_ID}`).expect(404));
    it('rejects malformed ids', () => http().get('/v1/products/not-a-uuid').expect(400));
    it('only serves routes under /v1', () => http().get('/products').expect(404));
  });

  describe('sign-in tokens', () => {
    it('requires a token', () => http().get('/v1/me').expect(401));
    it('rejects garbage', () => http().get('/v1/me').set('Authorization', 'Bearer not.a.jwt').expect(401));

    it('rejects a token signed with another key', async () =>
      http()
        .get('/v1/me')
        .set('Authorization', `Bearer ${await token({ sub: CUSTOMER_ID }, { key: otherKey })}`)
        .expect(401));

    it('rejects a token from another issuer', async () =>
      http()
        .get('/v1/me')
        .set('Authorization', `Bearer ${await token({ sub: CUSTOMER_ID }, { issuer: 'https://evil.example/auth/v1' })}`)
        .expect(401));

    it('rejects an expired token', async () =>
      http()
        .get('/v1/me')
        .set('Authorization', `Bearer ${await token({ sub: CUSTOMER_ID }, { expires: '-1m' })}`)
        .expect(401));

    it('accepts a valid customer token', async () => {
      const res = await http()
        .get('/v1/me')
        .set('Authorization', `Bearer ${await token({ sub: CUSTOMER_ID, email: 'c@example.com' })}`)
        .expect(200);
      expect(res.body).toEqual({ id: CUSTOMER_ID, email: 'c@example.com', twoStep: false, admin: false });
    });
  });

  describe('admin routes', () => {
    it('refuse customers', async () =>
      http()
        .get('/v1/test-admin')
        .set('Authorization', `Bearer ${await token({ sub: CUSTOMER_ID, aal: 'aal2' })}`)
        .expect(403));

    it('refuse an admin without two-step', async () =>
      http()
        .get('/v1/test-admin')
        .set('Authorization', `Bearer ${await token({ sub: ADMIN_ID, aal: 'aal1' })}`)
        .expect(403));

    it('allow an admin with two-step', async () =>
      http()
        .get('/v1/test-admin')
        .set('Authorization', `Bearer ${await token({ sub: ADMIN_ID, aal: 'aal2' })}`)
        .expect(200, { ok: true }));
  });

  describe('hardening', () => {
    it('sends security headers', async () => {
      const res = await http().get('/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-powered-by']).toBeUndefined();
    });

    it('allows CORS only for configured sites', async () => {
      const ok = await http().get('/v1/products').set('Origin', 'https://shop.example');
      expect(ok.headers['access-control-allow-origin']).toBe('https://shop.example');
      const blocked = await http().get('/v1/products').set('Origin', 'https://evil.example');
      expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});

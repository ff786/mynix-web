import { validateEnv } from './env.js';

const valid = {
  DATABASE_URL: 'postgres://user:pass@db.example:5432/postgres',
  SUPABASE_URL: 'https://project.supabase.co',
};

describe('validateEnv', () => {
  it('applies defaults', () => {
    expect(validateEnv(valid)).toMatchObject({ NODE_ENV: 'development', PORT: 4000, DB_POOL_MAX: 10, CORS_ORIGINS: ['http://localhost:3000'] });
  });

  it('splits CORS origins', () => {
    expect(validateEnv({ ...valid, CORS_ORIGINS: 'https://a.lk, https://b.lk' }).CORS_ORIGINS).toEqual(['https://a.lk', 'https://b.lk']);
  });

  it('refuses to start without a database', () => {
    expect(() => validateEnv({ SUPABASE_URL: valid.SUPABASE_URL })).toThrow(/DATABASE_URL/);
  });

  it('refuses a non-Postgres database URL', () => {
    expect(() => validateEnv({ ...valid, DATABASE_URL: 'mysql://x@y/z' })).toThrow(/DATABASE_URL/);
  });
});

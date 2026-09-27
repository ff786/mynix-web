import { z } from 'zod';

/**
 * Every setting the API reads, checked once at startup. A missing or malformed
 * value stops the process with a clear message instead of failing later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  /** Postgres connection string (Supabase pooler now, AWS RDS later). */
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),

  /** Supabase project URL, used to verify sign-in tokens against its public keys. */
  SUPABASE_URL: z.url({ protocol: /^https?$/ }),

  /** Comma-separated sites allowed to call the API from a browser. */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

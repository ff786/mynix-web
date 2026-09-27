import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { Env } from '../config/env.js';
import * as schema from './schema.js';

export type Database = PostgresJsDatabase<typeof schema>;

/** Injection tokens: `@Inject(DB)` for queries, `@Inject(SQL)` for the raw client. */
export const DB = Symbol('DB');
export const SQL = Symbol('SQL');

@Injectable()
class SqlShutdown implements OnApplicationShutdown {
  constructor(@Inject(SQL) private readonly sql: postgres.Sql) {}

  async onApplicationShutdown() {
    await this.sql.end({ timeout: 5 });
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SQL,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        postgres(config.get('DATABASE_URL', { infer: true }), {
          max: config.get('DB_POOL_MAX', { infer: true }),
          // Supabase's pooler (and RDS Proxy) don't support prepared statements
          // in transaction mode.
          prepare: false,
          connect_timeout: 10,
          idle_timeout: 30,
        }),
    },
    {
      provide: DB,
      inject: [SQL],
      useFactory: (sql: postgres.Sql): Database => drizzle(sql, { schema }),
    },
    SqlShutdown,
  ],
  exports: [DB, SQL],
})
export class DatabaseModule {}

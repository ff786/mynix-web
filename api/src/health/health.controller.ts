import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type postgres from 'postgres';
import { SQL } from '../database/database.module.js';

/** Liveness/readiness for the load balancer (AWS App Runner / ECS). */
@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(@Inject(SQL) private readonly sql: postgres.Sql) {}

  @Get()
  async check() {
    try {
      await Promise.race([
        this.sql`select 1`,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'unreachable' });
    }
    return { status: 'ok', database: 'ok' };
  }
}

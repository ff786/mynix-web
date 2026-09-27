import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import { DB, type Database } from '../database/database.module.js';
import { admins } from '../database/schema.js';
import { CurrentUser, SignedIn } from './guards.js';
import type { AuthUser } from './token-verifier.js';

@ApiTags('account')
@Controller('me')
export class MeController {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** Who the API sees you as — useful for the site and for debugging sign-in. */
  @Get()
  @SignedIn()
  async me(@CurrentUser() user: AuthUser) {
    const [admin] = await this.db.select().from(admins).where(eq(admins.userId, user.id)).limit(1);
    return { id: user.id, email: user.email, twoStep: user.aal === 'aal2', admin: Boolean(admin) };
  }
}

import {
  applyDecorators,
  createParamDecorator,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
  UseGuards,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { DB, type Database } from '../database/database.module.js';
import { admins } from '../database/schema.js';
import { TokenVerifier, type AuthUser } from './token-verifier.js';

type AuthedRequest = Request & { user?: AuthUser };

/** Requires a valid Supabase access token (`Authorization: Bearer …`). */
@Injectable()
export class SignedInGuard implements CanActivate {
  constructor(private readonly verifier: TokenVerifier) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const [scheme, token] = (request.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Sign in required');

    try {
      request.user = await this.verifier.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return true;
  }
}

/**
 * Requires an admin who has passed two-step sign-in — the same rule the
 * database policies enforce. Must run after SignedInGuard.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(@Inject(DB) private readonly db: Database) {}

  async canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user) throw new UnauthorizedException('Sign in required');
    if (user.aal !== 'aal2') throw new ForbiddenException('Two-step sign-in required');

    const [admin] = await this.db.select({ userId: admins.userId }).from(admins).where(eq(admins.userId, user.id)).limit(1);
    if (!admin) throw new ForbiddenException('Admins only');
    return true;
  }
}

/** Route needs a signed-in customer or admin. */
export const SignedIn = () => applyDecorators(UseGuards(SignedInGuard), ApiBearerAuth());

/** Route needs an admin with two-step sign-in. */
export const AdminOnly = () => applyDecorators(UseGuards(SignedInGuard, AdminGuard), ApiBearerAuth());

/** The verified user on a guarded route. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<AuthedRequest>().user,
);

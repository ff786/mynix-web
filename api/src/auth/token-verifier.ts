import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { Env } from '../config/env.js';

/** Supabase's public signing keys; overridable in tests. */
export const JWKS = Symbol('JWKS');

export const jwksProvider = {
  provide: JWKS,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Env, true>): JWTVerifyGetKey =>
    createRemoteJWKSet(new URL(`${config.get('SUPABASE_URL', { infer: true })}/auth/v1/.well-known/jwks.json`)),
};

export type AuthUser = {
  id: string;
  email: string | null;
  /** 'aal2' once the user has passed two-step sign-in. */
  aal: string;
};

/**
 * Checks a Supabase access token: signature against the project's public keys,
 * issuer, audience and expiry. Nothing in the token is trusted until this passes.
 */
@Injectable()
export class TokenVerifier {
  private readonly issuer: string;

  constructor(
    @Inject(JWKS) private readonly keys: JWTVerifyGetKey,
    config: ConfigService<Env, true>,
  ) {
    this.issuer = `${config.get('SUPABASE_URL', { infer: true })}/auth/v1`;
  }

  async verify(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, this.keys, {
      issuer: this.issuer,
      audience: 'authenticated',
      clockTolerance: 5,
    });
    if (!payload.sub) throw new Error('Token has no subject');

    return {
      id: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      aal: typeof payload.aal === 'string' ? payload.aal : 'aal1',
    };
  }
}

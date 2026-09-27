import { Global, Module } from '@nestjs/common';
import { AdminGuard, SignedInGuard } from './guards.js';
import { jwksProvider, TokenVerifier } from './token-verifier.js';

@Global()
@Module({
  providers: [jwksProvider, TokenVerifier, SignedInGuard, AdminGuard],
  exports: [TokenVerifier, SignedInGuard, AdminGuard],
})
export class AuthModule {}

import { Injectable } from '@nestjs/common';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';

// This should be used as guard class
// eslint-disable-next-line @typescript-eslint/naming-convention
export const AuthGuard = NestAuthGuard('jwt');
export const AuthGuardOptional = NestAuthGuard(['jwt', 'anonymous']);

@Injectable()
export class OptionalJwtAuthGuard extends NestAuthGuard('jwt') {
  // Override handleRequest so it never throws an error
  handleRequest(err, user) {
    return user;
  }
}

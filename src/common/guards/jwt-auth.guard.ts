import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

interface JwtErrorInfo {
  name: string;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(
    err: Error | null,
    user: TUser | false,
    info: JwtErrorInfo | null,
  ): TUser {
    if (
      info?.name === 'TokenExpiredError' ||
      info?.name === 'JsonWebTokenError'
    ) {
      throw new UnauthorizedException('Invalid token');
    }
    if (err ?? !user) {
      throw err ?? new UnauthorizedException('Invalid token');
    }
    return user as TUser;
  }
}

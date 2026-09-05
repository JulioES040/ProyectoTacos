import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<{ method: string; headers: { cookie?: string; origin?: string }; user?: ReturnType<AuthService['readSession']> }>();
    const session = this.auth.readSession(request.headers.cookie);
    if (!session) throw new UnauthorizedException('Inicia sesion para continuar');
    request.user = session;
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles?.length && !roles.includes(session.role)) throw new ForbiddenException('No tienes permiso para acceder a esta funcion');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && request.headers.origin) {
      const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(',').map((origin) => origin.trim()) ?? [];
      if (!allowedOrigins.includes(request.headers.origin)) throw new ForbiddenException('Origen no permitido');
    }
    return true;
  }
}

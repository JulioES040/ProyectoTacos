import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma/prisma.service';
import { verifyPassword } from './password';

export type Session = { sub: string; username: string; role: UserRole; exp: number };
export const jwtIssuer = 'el-buen-taco-api';
export const jwtAudience = 'el-buen-taco-pos';
export const sessionCookieName = () => process.env.NODE_ENV === 'production' ? '__Host-ebt_session' : 'ebt_session';

export function sessionSecret(secret = process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) throw new Error('SESSION_SECRET must contain at least 32 characters in production');
  return secret ?? 'local-development-secret-change-before-production';
}

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}

  async login(username: string, password: string) {
    const normalized = username.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { username: normalized } });
    if (!user?.active || !verifyPassword(password, user.passwordHash)) throw new UnauthorizedException('Credenciales invalidas');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    const session = { sub: user.id, username: user.username, role: user.role };
    return { token: this.jwt.sign(session, { issuer: jwtIssuer, audience: jwtAudience }), user: session };
  }

  readSession(cookie?: string) {
    const cookieName = sessionCookieName();
    const token = cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!token) return null;
    try {
      return this.jwt.verify<Session>(token, { issuer: jwtIssuer, audience: jwtAudience });
    } catch { return null; }
  }

  cookieOptions() {
    const secure = process.env.NODE_ENV === 'production';
    return { httpOnly: true, secure, sameSite: secure ? 'none' as const : 'lax' as const, maxAge: 8 * 60 * 60 * 1000, path: '/' };
  }

}

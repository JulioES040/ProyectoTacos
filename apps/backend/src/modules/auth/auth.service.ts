import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

type Session = { email: string; exp: number };

@Injectable()
export class AuthService {
  private readonly secret = process.env.SESSION_SECRET ?? 'local-development-secret-change-before-production';

  login(email: string, password: string) {
    const expectedEmail = process.env.ADMIN_EMAIL ?? 'admin@elbuentaco.local';
    const expectedPassword = process.env.ADMIN_PASSWORD ?? 'cambia-esta-clave';
    if (!this.matches(email, expectedEmail) || !this.matches(password, expectedPassword)) throw new UnauthorizedException('Credenciales invalidas');
    return this.sign({ email: expectedEmail, exp: Date.now() + 8 * 60 * 60 * 1000 });
  }

  readSession(cookie?: string) {
    const token = cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('ebt_session='))?.slice('ebt_session='.length);
    if (!token) return null;
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature || !this.matches(signature, this.signature(encoded))) return null;
    try {
      const session = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as Session;
      return session.exp > Date.now() ? session : null;
    } catch { return null; }
  }

  cookieOptions() {
    const secure = process.env.NODE_ENV === 'production';
    return { httpOnly: true, secure, sameSite: secure ? 'none' as const : 'lax' as const, maxAge: 8 * 60 * 60 * 1000, path: '/' };
  }

  private sign(session: Session) {
    const encoded = Buffer.from(JSON.stringify(session)).toString('base64url');
    return `${encoded}.${this.signature(encoded)}`;
  }

  private signature(value: string) { return createHmac('sha256', this.secret).update(value).digest('base64url'); }

  private matches(value: string, expected: string) {
    const left = Buffer.from(value);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}

import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { AuthService, Session, sessionCookieName } from './auth.service';
import { Public } from './public.decorator';

class LoginDto {
  @IsString() @MinLength(3) @MaxLength(50) username!: string;
  @IsString() @MinLength(8) password!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Inicia una sesion administrativa mediante cookie HTTP-only' })
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: { cookie: (name: string, value: string, options: object) => void }) {
    const result = await this.auth.login(body.username, body.password);
    response.cookie(sessionCookieName(), result.token, this.auth.cookieOptions());
    return result.user;
  }

  @Get('session')
  @ApiOperation({ summary: 'Verifica la sesion actual' })
  session(@Req() request: { user: Session }) { return { authenticated: true, ...request.user }; }

  @Post('logout')
  @ApiOperation({ summary: 'Cierra la sesion administrativa' })
  logout(@Res({ passthrough: true }) response: { clearCookie: (name: string, options: object) => void }) {
    response.clearCookie(sessionCookieName(), this.auth.cookieOptions());
    return { ok: true };
  }
}

import { Body, Controller, Get, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

class LoginDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Inicia una sesion administrativa mediante cookie HTTP-only' })
  login(@Body() body: LoginDto, @Res({ passthrough: true }) response: { cookie: (name: string, value: string, options: object) => void }) {
    response.cookie('ebt_session', this.auth.login(body.email, body.password), this.auth.cookieOptions());
    return { email: body.email };
  }

  @Get('session')
  @ApiOperation({ summary: 'Verifica la sesion actual' })
  session(@Res({ passthrough: true }) _response: unknown) { return { authenticated: true }; }

  @Post('logout')
  @ApiOperation({ summary: 'Cierra la sesion administrativa' })
  logout(@Res({ passthrough: true }) response: { clearCookie: (name: string, options: object) => void }) {
    response.clearCookie('ebt_session', this.auth.cookieOptions());
    return { ok: true };
  }
}

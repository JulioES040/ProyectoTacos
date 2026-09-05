import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService, sessionSecret } from './auth.service';

@Module({
  imports: [JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({ secret: sessionSecret(config.get<string>('SESSION_SECRET')), signOptions: { expiresIn: '8h', issuer: 'el-buen-taco-api', audience: 'el-buen-taco-pos' } }),
  })],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

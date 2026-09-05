import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from './modules/auth/public.decorator';
import { PrismaService } from './database/prisma/prisma.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Comprueba que la API esta disponible' })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', storage: 'postgresql', timestamp: new Date().toISOString() };
  }
}

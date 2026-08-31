import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Comprueba que la API esta disponible' })
  check() {
    return { status: 'ok', storage: 'memory', timestamp: new Date().toISOString() };
  }
}

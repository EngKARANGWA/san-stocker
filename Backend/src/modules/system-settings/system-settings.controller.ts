import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('system-settings')
@ApiBearerAuth()
@Controller('system-settings')
export class SystemSettingsController {
  @ApiOperation({
    summary: '[Not yet implemented] System settings module status',
    description:
      'Placeholder for currency, tax rate, receipt templates and backup configuration. See system-settings.service.ts.',
  })
  @RequirePermissions('settings:manage')
  @Get('status')
  status() {
    return { module: 'system-settings', implemented: false };
  }
}

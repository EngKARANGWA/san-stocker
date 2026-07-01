import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('hr')
@ApiBearerAuth()
@Controller('hr')
export class HrController {
  @ApiOperation({
    summary: '[Not yet implemented] HR & staff management module status',
    description:
      'Placeholder for employee records, attendance, leave and recruitment. See hr.service.ts.',
  })
  @RequirePermissions('hr:read')
  @Get('status')
  status() {
    return { module: 'hr', implemented: false };
  }
}

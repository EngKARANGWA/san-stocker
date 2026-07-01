import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('payroll')
@ApiBearerAuth()
@Controller('payroll')
export class PayrollController {
  @ApiOperation({
    summary: '[Not yet implemented] Payroll module status',
    description:
      'Placeholder for salaries, deductions, bonuses and statutory contributions. See payroll.service.ts.',
  })
  @RequirePermissions('payroll:read')
  @Get('status')
  status() {
    return { module: 'payroll', implemented: false };
  }
}

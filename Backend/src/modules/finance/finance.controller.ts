import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('finance')
@ApiBearerAuth()
@Controller('finance')
export class FinanceController {
  @ApiOperation({
    summary: '[Not yet implemented] Financial management module status',
    description:
      'Placeholder for payments, expenses, invoices, tax and bank reconciliation. See finance.service.ts.',
  })
  @RequirePermissions('finance:read')
  @Get('status')
  status() {
    return { module: 'finance', implemented: false };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  @ApiOperation({
    summary: '[Not yet implemented] Delivery management module status',
    description:
      'Placeholder for delivery status, signatures and confirmations. See delivery.service.ts.',
  })
  @RequirePermissions('delivery:read')
  @Get('status')
  status() {
    return { module: 'delivery', implemented: false };
  }
}

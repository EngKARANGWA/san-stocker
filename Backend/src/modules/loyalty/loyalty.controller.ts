import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('loyalty')
@ApiBearerAuth()
@Controller('loyalty')
export class LoyaltyController {
  @ApiOperation({
    summary: '[Not yet implemented] Loyalty program module status',
    description:
      'Placeholder for coupons, membership tiers and point redemption. Points are already accrued by sales - see loyalty.service.ts.',
  })
  @RequirePermissions('loyalty:read')
  @Get('status')
  status() {
    return { module: 'loyalty', implemented: false };
  }
}

import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('promotions')
@ApiBearerAuth()
@Controller('promotions')
export class PromotionsController {
  @ApiOperation({
    summary: '[Not yet implemented] Promotions & discounts module status',
    description:
      'Placeholder for campaigns, vouchers and scheduled price rules. See promotions.service.ts.',
  })
  @RequirePermissions('promotions:read')
  @Get('status')
  status() {
    return { module: 'promotions', implemented: false };
  }
}

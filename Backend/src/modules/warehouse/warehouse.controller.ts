import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('warehouse')
@ApiBearerAuth()
@Controller('warehouse')
export class WarehouseController {
  @ApiOperation({
    summary: '[Not yet implemented] Warehouse management module status',
    description:
      'Stock receiving/transfers/adjustments already live in the Inventory module. Placeholder for storage locations and putaway tasks. See warehouse.service.ts.',
  })
  @RequirePermissions('warehouse:read')
  @Get('status')
  status() {
    return { module: 'warehouse', implemented: false };
  }
}

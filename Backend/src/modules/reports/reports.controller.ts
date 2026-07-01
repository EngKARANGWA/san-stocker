import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { InventorySummaryQueryDto } from './dto/inventory-summary-query.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({
    summary: 'Sales totals and breakdown by payment method',
    description: 'Optionally filter by branch and a date range. Only COMPLETED sales are counted.',
  })
  @RequirePermissions('reports:view_sales')
  @Get('sales-summary')
  salesSummary(@CurrentUser() user: AuthenticatedUser, @Query() query: SalesSummaryQueryDto) {
    return this.reportsService.salesSummary(user.tenantId!, query);
  }

  @ApiOperation({
    summary: 'Stock value and low-stock alert list',
    description: 'Flags every stock item at or below its product reorderLevel.',
  })
  @RequirePermissions('reports:view_inventory')
  @Get('inventory-summary')
  inventorySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: InventorySummaryQueryDto,
  ) {
    return this.reportsService.inventorySummary(user.tenantId!, query);
  }
}

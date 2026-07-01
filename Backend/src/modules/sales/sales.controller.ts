import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @ApiOperation({
    summary: 'Record a POS sale',
    description:
      'Server prices each line from the current product sellingPrice, decrements stock at the branch, and (if customerId is set) accrues loyalty points. Rejects insufficient stock and unauthorized discounts.',
  })
  @RequirePermissions('sales:create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.salesService.create(user, dto);
  }

  @ApiOperation({ summary: 'List sales (paginated, filterable by branch/status)' })
  @RequirePermissions('sales:read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: SaleQueryDto) {
    return this.salesService.findAll(user.tenantId!, query);
  }

  @ApiOperation({ summary: 'Get a sale (receipt) by id' })
  @RequirePermissions('sales:read')
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.salesService.findOne(user.tenantId!, id);
  }

  @ApiOperation({
    summary: 'Fully refund a completed sale',
    description:
      'Restocks every line item and marks the sale REFUNDED. Only COMPLETED sales can be refunded.',
  })
  @RequirePermissions('sales:refund')
  @Patch(':id/refund')
  refund(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.salesService.refund(user.tenantId!, user.id, id);
  }
}

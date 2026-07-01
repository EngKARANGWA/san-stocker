import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiOperation({
    summary: 'List per-branch stock levels (paginated, optionally filtered by branch)',
  })
  @RequirePermissions('inventory:read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: InventoryQueryDto) {
    return this.inventoryService.findAll(user.tenantId!, query);
  }

  @ApiOperation({ summary: 'Get the movement history (in/out ledger) for one stock item' })
  @RequirePermissions('inventory:read')
  @Get(':stockItemId/movements')
  getMovements(
    @CurrentUser() user: AuthenticatedUser,
    @Param('stockItemId') stockItemId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.inventoryService.getMovements(user.tenantId!, stockItemId, query);
  }

  @ApiOperation({
    summary: 'Manually adjust stock at a branch (e.g. stock count correction, damage/loss)',
    description: 'Creates the StockItem if it does not exist yet. Cannot reduce stock below zero.',
  })
  @RequirePermissions('inventory:adjust')
  @Post('adjust')
  adjust(@CurrentUser() user: AuthenticatedUser, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjust(user.tenantId!, user.id, dto);
  }

  @ApiOperation({ summary: 'Move stock from one branch to another' })
  @RequirePermissions('inventory:transfer')
  @Post('transfer')
  transfer(@CurrentUser() user: AuthenticatedUser, @Body() dto: TransferStockDto) {
    return this.inventoryService.transfer(user.tenantId!, user.id, dto);
  }
}

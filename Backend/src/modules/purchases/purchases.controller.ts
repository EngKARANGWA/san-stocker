import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { PurchasesService } from './purchases.service';

@ApiTags('purchases')
@ApiBearerAuth()
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @ApiOperation({ summary: 'Create a draft purchase order with its line items' })
  @RequirePermissions('purchases:create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePurchaseOrderDto) {
    return this.purchasesService.create(user.tenantId!, user.id, dto);
  }

  @ApiOperation({ summary: 'List purchase orders (paginated, filterable by status)' })
  @RequirePermissions('purchases:read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PurchaseOrderQueryDto) {
    return this.purchasesService.findAll(user.tenantId!, query);
  }

  @ApiOperation({ summary: 'Get a purchase order by id' })
  @RequirePermissions('purchases:read')
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.purchasesService.findOne(user.tenantId!, id);
  }

  @ApiOperation({ summary: 'Update the notes/expected date of a DRAFT or PENDING order' })
  @RequirePermissions('purchases:update')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
  ) {
    return this.purchasesService.update(user.tenantId!, id, dto);
  }

  @ApiOperation({ summary: 'Approve a purchase order, moving it from DRAFT/PENDING to APPROVED' })
  @RequirePermissions('purchases:approve')
  @Patch(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.purchasesService.approve(user.tenantId!, id);
  }

  @ApiOperation({
    summary: 'Record goods received against an order (full or partial)',
    description:
      'Increments stock at the order branch and writes PURCHASE_IN stock movements; updates the order status to PARTIALLY_RECEIVED or RECEIVED.',
  })
  @RequirePermissions('purchases:receive')
  @Patch(':id/receive')
  receive(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ReceivePurchaseOrderDto,
  ) {
    return this.purchasesService.receive(user.tenantId!, user.id, id, dto);
  }

  @ApiOperation({ summary: 'Cancel a purchase order that has not been received yet' })
  @RequirePermissions('purchases:update')
  @Patch(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.purchasesService.cancel(user.tenantId!, id);
  }
}

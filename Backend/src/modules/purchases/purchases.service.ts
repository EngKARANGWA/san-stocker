import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PurchaseOrderStatus, StockMovementType } from '@prisma/client';
import { paginate } from '../../common/dto/paginated-result';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { PurchaseOrderQueryDto } from './dto/purchase-order-query.dto';
import { ReceivePurchaseOrderDto } from './dto/receive-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';

const purchaseOrderInclude = {
  items: { include: { product: true } },
  supplier: true,
  branch: true,
} satisfies Prisma.PurchaseOrderInclude;

@Injectable()
export class PurchasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreatePurchaseOrderDto) {
    await this.assertBelongsToTenant('branch', dto.branchId, tenantId);
    await this.assertBelongsToTenant('supplier', dto.supplierId, tenantId);

    const orderNumber = await this.generateOrderNumber(tenantId);

    return this.prisma.purchaseOrder.create({
      data: {
        tenantId,
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        orderNumber,
        expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
        notes: dto.notes,
        createdById: userId,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantityOrdered: item.quantityOrdered,
            unitCost: item.unitCost,
          })),
        },
      },
      include: purchaseOrderInclude,
    });
  }

  async findAll(tenantId: string, query: PurchaseOrderQueryDto) {
    const where: Prisma.PurchaseOrderWhereInput = {
      tenantId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { orderNumber: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: purchaseOrderInclude,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: purchaseOrderInclude,
    });
    if (!order) {
      throw new NotFoundException('Purchase order not found');
    }
    return order;
  }

  async update(tenantId: string, id: string, dto: UpdatePurchaseOrderDto) {
    const order = await this.findOne(tenantId, id);
    this.assertStatusIn(order.status, [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING]);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        expectedAt: dto.expectedAt ? new Date(dto.expectedAt) : undefined,
        notes: dto.notes,
      },
      include: purchaseOrderInclude,
    });
  }

  async approve(tenantId: string, id: string) {
    const order = await this.findOne(tenantId, id);
    this.assertStatusIn(order.status, [PurchaseOrderStatus.DRAFT, PurchaseOrderStatus.PENDING]);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.APPROVED, orderedAt: new Date() },
      include: purchaseOrderInclude,
    });
  }

  async cancel(tenantId: string, id: string) {
    const order = await this.findOne(tenantId, id);
    this.assertStatusIn(order.status, [
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.PENDING,
      PurchaseOrderStatus.APPROVED,
    ]);

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      include: purchaseOrderInclude,
    });
  }

  /**
   * Records goods received against an approved/ordered purchase order:
   * increments StockItem quantities and writes a PURCHASE_IN StockMovement
   * per item, then derives the order's new status from total received vs
   * ordered quantities.
   */
  async receive(tenantId: string, userId: string, id: string, dto: ReceivePurchaseOrderDto) {
    const order = await this.findOne(tenantId, id);
    this.assertStatusIn(order.status, [
      PurchaseOrderStatus.APPROVED,
      PurchaseOrderStatus.ORDERED,
      PurchaseOrderStatus.PARTIALLY_RECEIVED,
    ]);

    return this.prisma.$transaction(async (tx) => {
      for (const receivedItem of dto.items) {
        const orderItem = order.items.find((item) => item.productId === receivedItem.productId);
        if (!orderItem) {
          throw new BadRequestException(
            `Product ${receivedItem.productId} is not part of this purchase order`,
          );
        }

        const remaining = orderItem.quantityOrdered - orderItem.quantityReceived;
        if (receivedItem.quantityReceived > remaining) {
          throw new BadRequestException(
            `Cannot receive more than the remaining ${remaining} unit(s) for product ${receivedItem.productId}`,
          );
        }

        await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: { quantityReceived: { increment: receivedItem.quantityReceived } },
        });

        const stockItem = await tx.stockItem.upsert({
          where: {
            productId_branchId: { productId: receivedItem.productId, branchId: order.branchId },
          },
          create: { productId: receivedItem.productId, branchId: order.branchId, quantity: 0 },
          update: {},
        });

        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: { increment: receivedItem.quantityReceived } },
        });

        await tx.stockMovement.create({
          data: {
            stockItemId: stockItem.id,
            type: StockMovementType.PURCHASE_IN,
            quantity: receivedItem.quantityReceived,
            reference: order.orderNumber,
            createdById: userId,
          },
        });
      }

      const refreshedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: id },
      });
      const fullyReceived = refreshedItems.every(
        (item) => item.quantityReceived >= item.quantityOrdered,
      );
      const partiallyReceived = refreshedItems.some((item) => item.quantityReceived > 0);

      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: fullyReceived
            ? PurchaseOrderStatus.RECEIVED
            : partiallyReceived
              ? PurchaseOrderStatus.PARTIALLY_RECEIVED
              : order.status,
          receivedAt: fullyReceived ? new Date() : undefined,
        },
        include: purchaseOrderInclude,
      });
    });
  }

  private assertStatusIn(current: PurchaseOrderStatus, allowed: PurchaseOrderStatus[]) {
    if (!allowed.includes(current)) {
      throw new BadRequestException(
        `Purchase order is in "${current}" status; expected one of: ${allowed.join(', ')}`,
      );
    }
  }

  private async generateOrderNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.purchaseOrder.count({ where: { tenantId } });
    return `PO-${String(count + 1).padStart(6, '0')}`;
  }

  private async assertBelongsToTenant(
    entity: 'branch' | 'supplier',
    id: string,
    tenantId: string,
  ): Promise<void> {
    const record =
      entity === 'branch'
        ? await this.prisma.branch.findFirst({ where: { id, tenantId } })
        : await this.prisma.supplier.findFirst({ where: { id, tenantId } });

    if (!record) {
      throw new NotFoundException(`${entity[0].toUpperCase()}${entity.slice(1)} not found`);
    }
  }
}

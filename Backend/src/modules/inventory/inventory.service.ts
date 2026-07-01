import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, StockMovementType } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/dto/paginated-result';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustStockDto, StockAdjustmentDirection } from './dto/adjust-stock.dto';
import { InventoryQueryDto } from './dto/inventory-query.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: InventoryQueryDto) {
    const where: Prisma.StockItemWhereInput = {
      branch: { tenantId },
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.search
        ? { product: { name: { contains: query.search, mode: 'insensitive' } } }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockItem.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        include: { product: true, branch: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.stockItem.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async getMovements(tenantId: string, stockItemId: string, query: PaginationQueryDto) {
    const stockItem = await this.prisma.stockItem.findFirst({
      where: { id: stockItemId, branch: { tenantId } },
    });
    if (!stockItem) {
      throw new NotFoundException('Stock item not found');
    }

    const where: Prisma.StockMovementWhereInput = { stockItemId };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async adjust(tenantId: string, userId: string, dto: AdjustStockDto) {
    await this.assertBranchBelongsToTenant(tenantId, dto.branchId);
    await this.assertProductBelongsToTenant(tenantId, dto.productId);

    const type =
      dto.direction === StockAdjustmentDirection.IN
        ? StockMovementType.ADJUSTMENT_IN
        : StockMovementType.ADJUSTMENT_OUT;
    const delta = dto.direction === StockAdjustmentDirection.IN ? dto.quantity : -dto.quantity;

    return this.prisma.$transaction(async (tx) => {
      const stockItem = await this.findOrCreateStockItem(tx, dto.productId, dto.branchId);

      if (stockItem.quantity + delta < 0) {
        throw new BadRequestException('Insufficient stock for this adjustment');
      }

      const updated = await tx.stockItem.update({
        where: { id: stockItem.id },
        data: { quantity: { increment: delta } },
      });

      await tx.stockMovement.create({
        data: {
          stockItemId: stockItem.id,
          type,
          quantity: dto.quantity,
          note: dto.note,
          createdById: userId,
        },
      });

      return updated;
    });
  }

  async transfer(tenantId: string, userId: string, dto: TransferStockDto) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException('Source and destination branches must be different');
    }

    await this.assertBranchBelongsToTenant(tenantId, dto.fromBranchId);
    await this.assertBranchBelongsToTenant(tenantId, dto.toBranchId);
    await this.assertProductBelongsToTenant(tenantId, dto.productId);

    return this.prisma.$transaction(async (tx) => {
      const sourceItem = await this.findOrCreateStockItem(tx, dto.productId, dto.fromBranchId);

      if (sourceItem.quantity < dto.quantity) {
        throw new BadRequestException('Insufficient stock at source branch for this transfer');
      }

      const destinationItem = await this.findOrCreateStockItem(tx, dto.productId, dto.toBranchId);

      await tx.stockItem.update({
        where: { id: sourceItem.id },
        data: { quantity: { decrement: dto.quantity } },
      });
      await tx.stockItem.update({
        where: { id: destinationItem.id },
        data: { quantity: { increment: dto.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          stockItemId: sourceItem.id,
          type: StockMovementType.TRANSFER_OUT,
          quantity: dto.quantity,
          reference: dto.toBranchId,
          note: dto.note,
          createdById: userId,
        },
      });
      await tx.stockMovement.create({
        data: {
          stockItemId: destinationItem.id,
          type: StockMovementType.TRANSFER_IN,
          quantity: dto.quantity,
          reference: dto.fromBranchId,
          note: dto.note,
          createdById: userId,
        },
      });

      return { fromBranchId: dto.fromBranchId, toBranchId: dto.toBranchId, quantity: dto.quantity };
    });
  }

  private async findOrCreateStockItem(
    tx: Prisma.TransactionClient,
    productId: string,
    branchId: string,
  ) {
    const existing = await tx.stockItem.findUnique({
      where: { productId_branchId: { productId, branchId } },
    });
    if (existing) {
      return existing;
    }
    return tx.stockItem.create({ data: { productId, branchId, quantity: 0 } });
  }

  private async assertBranchBelongsToTenant(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
  }

  private async assertProductBelongsToTenant(tenantId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, tenantId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
  }
}

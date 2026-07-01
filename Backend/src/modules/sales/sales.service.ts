import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SaleStatus, StockMovementType } from '@prisma/client';
import { paginate } from '../../common/dto/paginated-result';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SaleQueryDto } from './dto/sale-query.dto';

const saleInclude = {
  items: { include: { product: true } },
  customer: true,
  cashier: { select: { id: true, firstName: true, lastName: true } },
  branch: true,
} satisfies Prisma.SaleInclude;

/** Loyalty points earned per currency unit spent on a completed sale. */
const LOYALTY_POINTS_PER_CURRENCY_UNIT = 1 / 1000;

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(currentUser: AuthenticatedUser, dto: CreateSaleDto) {
    const tenantId = currentUser.tenantId!;
    await this.assertBranchBelongsToTenant(tenantId, dto.branchId);

    const hasDiscount = dto.items.some((item) => (item.discount ?? 0) > 0);
    if (
      hasDiscount &&
      !currentUser.isSuperAdmin &&
      !currentUser.permissions.includes('sales:discount')
    ) {
      throw new ForbiddenException('You are not authorized to apply discounts on a sale');
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((item) => item.productId) }, tenantId },
    });
    if (products.length !== new Set(dto.items.map((item) => item.productId)).size) {
      throw new NotFoundException('One or more products were not found');
    }

    const lineItems = dto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const unitPrice = Number(product.sellingPrice);
      const discount = item.discount ?? 0;
      const lineTotal = unitPrice * item.quantity - discount;
      return { ...item, unitPrice, discount, lineTotal, productName: product.name };
    });

    const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const discountTotal = lineItems.reduce((sum, item) => sum + item.discount, 0);
    const grandTotal = subtotal - discountTotal;

    if (dto.amountPaid < grandTotal && dto.paymentMethod !== 'CREDIT') {
      throw new BadRequestException('Amount paid is less than the total due');
    }
    const changeDue = Math.max(0, dto.amountPaid - grandTotal);

    const receiptNumber = await this.generateReceiptNumber(tenantId);

    const sale = await this.prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        const stockItem = await tx.stockItem.findUnique({
          where: { productId_branchId: { productId: item.productId, branchId: dto.branchId } },
        });
        if (!stockItem || stockItem.quantity < item.quantity) {
          throw new BadRequestException(`Insufficient stock for ${item.productName}`);
        }

        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: { decrement: item.quantity } },
        });
      }

      const createdSale = await tx.sale.create({
        data: {
          tenantId,
          branchId: dto.branchId,
          customerId: dto.customerId,
          cashierId: currentUser.id,
          receiptNumber,
          subtotal,
          discountTotal,
          taxTotal: 0,
          grandTotal,
          amountPaid: dto.amountPaid,
          changeDue,
          paymentMethod: dto.paymentMethod,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: saleInclude,
      });

      for (const item of lineItems) {
        const stockItem = await tx.stockItem.findUniqueOrThrow({
          where: { productId_branchId: { productId: item.productId, branchId: dto.branchId } },
        });
        await tx.stockMovement.create({
          data: {
            stockItemId: stockItem.id,
            type: StockMovementType.SALE_OUT,
            quantity: item.quantity,
            reference: receiptNumber,
            createdById: currentUser.id,
          },
        });
      }

      if (dto.customerId) {
        const pointsEarned = Math.floor(grandTotal * LOYALTY_POINTS_PER_CURRENCY_UNIT);
        if (pointsEarned > 0) {
          await tx.customer.update({
            where: { id: dto.customerId },
            data: { loyaltyPoints: { increment: pointsEarned } },
          });
        }
      }

      return createdSale;
    });

    return sale;
  }

  async findAll(tenantId: string, query: SaleQueryDto) {
    const where: Prisma.SaleWhereInput = {
      tenantId,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? { receiptNumber: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.sale.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: saleInclude,
      }),
      this.prisma.sale.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: saleInclude,
    });
    if (!sale) {
      throw new NotFoundException('Sale not found');
    }
    return sale;
  }

  /** Fully reverses a completed sale: restocks every line item and marks the sale REFUNDED. */
  async refund(tenantId: string, userId: string, id: string) {
    const sale = await this.findOne(tenantId, id);
    if (sale.status !== SaleStatus.COMPLETED) {
      throw new BadRequestException(
        `Only completed sales can be refunded (current status: ${sale.status})`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of sale.items) {
        const stockItem = await tx.stockItem.upsert({
          where: { productId_branchId: { productId: item.productId, branchId: sale.branchId } },
          create: { productId: item.productId, branchId: sale.branchId, quantity: 0 },
          update: {},
        });

        await tx.stockItem.update({
          where: { id: stockItem.id },
          data: { quantity: { increment: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            stockItemId: stockItem.id,
            type: StockMovementType.RETURN_IN,
            quantity: item.quantity,
            reference: sale.receiptNumber,
            createdById: userId,
          },
        });
      }

      return tx.sale.update({
        where: { id },
        data: { status: SaleStatus.REFUNDED },
        include: saleInclude,
      });
    });
  }

  private async generateReceiptNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.sale.count({ where: { tenantId } });
    return `RCT-${String(count + 1).padStart(6, '0')}`;
  }

  private async assertBranchBelongsToTenant(tenantId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
  }
}

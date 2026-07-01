import { Injectable } from '@nestjs/common';
import { Prisma, SaleStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { InventorySummaryQueryDto } from './dto/inventory-summary-query.dto';
import { SalesSummaryQueryDto } from './dto/sales-summary-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async salesSummary(tenantId: string, query: SalesSummaryQueryDto) {
    const where: Prisma.SaleWhereInput = {
      tenantId,
      status: SaleStatus.COMPLETED,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };

    const [aggregate, byPaymentMethod] = await Promise.all([
      this.prisma.sale.aggregate({
        where,
        _count: { _all: true },
        _sum: { grandTotal: true, discountTotal: true, taxTotal: true },
      }),
      this.prisma.sale.groupBy({
        by: ['paymentMethod'],
        where,
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
    ]);

    return {
      totalSales: aggregate._count._all,
      totalRevenue: aggregate._sum.grandTotal ?? 0,
      totalDiscounts: aggregate._sum.discountTotal ?? 0,
      totalTax: aggregate._sum.taxTotal ?? 0,
      byPaymentMethod: byPaymentMethod.map((row) => ({
        paymentMethod: row.paymentMethod,
        count: row._count._all,
        revenue: row._sum.grandTotal ?? 0,
      })),
    };
  }

  async inventorySummary(tenantId: string, query: InventorySummaryQueryDto) {
    const stockItems = await this.prisma.stockItem.findMany({
      where: { branch: { tenantId }, ...(query.branchId ? { branchId: query.branchId } : {}) },
      include: { product: true, branch: true },
    });

    const lowStock = stockItems.filter((item) => item.quantity <= item.product.reorderLevel);
    const totalStockValue = stockItems.reduce(
      (sum, item) => sum + item.quantity * Number(item.product.costPrice),
      0,
    );

    return {
      totalStockItems: stockItems.length,
      totalStockValue,
      lowStockCount: lowStock.length,
      lowStockItems: lowStock.map((item) => ({
        productId: item.productId,
        productName: item.product.name,
        branchId: item.branchId,
        branchName: item.branch.name,
        quantity: item.quantity,
        reorderLevel: item.product.reorderLevel,
      })),
    };
  }
}

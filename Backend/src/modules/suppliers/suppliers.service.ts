import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/dto/paginated-result';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, dto: CreateSupplierDto) {
    return this.prisma.supplier.create({ data: { ...dto, tenantId } });
  }

  async findAll(tenantId: string, query: PaginationQueryDto) {
    const where: Prisma.SupplierWhereInput = {
      tenantId,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.supplier.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id, tenantId } });
    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }
    return supplier;
  }

  async update(tenantId: string, id: string, dto: UpdateSupplierDto) {
    await this.findOne(tenantId, id);
    return this.prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.supplier.update({ where: { id }, data: { isActive: false } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/dto/paginated-result';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantProvisioningService: TenantProvisioningService,
  ) {}

  async create(dto: CreateTenantDto) {
    const { tenant } = await this.tenantProvisioningService.provisionTenant({
      tenant: dto.tenant,
      owner: dto.owner,
      subscriptionPlan: dto.subscriptionPlan,
    });
    return tenant;
  }

  async findAll(query: PaginationQueryDto) {
    const where: Prisma.TenantWhereInput = query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { slug: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { users: true, branches: true } } },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: { branches: true, _count: { select: { users: true } } },
    });
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async updateSubscription(id: string, dto: UpdateSubscriptionDto) {
    await this.findOne(id);
    return this.prisma.tenant.update({
      where: { id },
      data: {
        subscriptionPlan: dto.subscriptionPlan,
        subscriptionStatus: dto.subscriptionStatus,
        subscriptionStartsAt: dto.subscriptionStartsAt
          ? new Date(dto.subscriptionStartsAt)
          : undefined,
        subscriptionEndsAt: dto.subscriptionEndsAt ? new Date(dto.subscriptionEndsAt) : undefined,
      },
    });
  }

  /**
   * Deactivates a client account rather than deleting it - tenant data
   * (sales history, inventory, etc.) must be retained for audit purposes.
   */
  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: false } });
  }

  async reactivate(id: string) {
    await this.findOne(id);
    return this.prisma.tenant.update({ where: { id }, data: { isActive: true } });
  }
}

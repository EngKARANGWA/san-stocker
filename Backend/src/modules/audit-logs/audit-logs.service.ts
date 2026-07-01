import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { paginate } from '../../common/dto/paginated-result';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: PaginationQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(query.search
        ? {
            OR: [
              { action: { contains: query.search, mode: 'insensitive' } },
              { entityType: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return paginate(data, total, query.page, query.limit);
  }

  /** Lightweight helper other modules can call to record an action without wiring a full audit pipeline. */
  record(input: Prisma.AuditLogUncheckedCreateInput) {
    return this.prisma.auditLog.create({ data: input });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  create(tenantId: string, dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: { ...dto, tenantId } });
  }

  findAll(tenantId: string) {
    return this.prisma.branch.findMany({ where: { tenantId }, orderBy: { createdAt: 'asc' } });
  }

  async findOne(tenantId: string, id: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id, tenantId } });
    if (!branch) {
      throw new NotFoundException('Branch not found');
    }
    return branch;
  }

  async update(tenantId: string, id: string, dto: UpdateBranchDto) {
    await this.findOne(tenantId, id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.branch.update({ where: { id }, data: { isActive: false } });
  }
}

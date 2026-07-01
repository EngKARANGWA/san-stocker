import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

const roleWithPermissionsInclude = {
  permissions: { include: { permission: true } },
} as const;

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateRoleDto) {
    const role = await this.prisma.role.create({
      data: { tenantId, name: dto.name, description: dto.description },
    });

    if (dto.permissionCodes?.length) {
      await this.replacePermissions(role.id, dto.permissionCodes);
    }

    return this.findOne(tenantId, role.id);
  }

  findAll(tenantId: string) {
    return this.prisma.role.findMany({
      where: { tenantId },
      include: roleWithPermissionsInclude,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, tenantId },
      include: roleWithPermissionsInclude,
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async update(tenantId: string, id: string, dto: UpdateRoleDto) {
    await this.findOne(tenantId, id);
    return this.prisma.role.update({ where: { id }, data: dto });
  }

  async assignPermissions(tenantId: string, id: string, dto: AssignPermissionsDto) {
    await this.findOne(tenantId, id);
    await this.replacePermissions(id, dto.permissionCodes);
    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const role = await this.findOne(tenantId, id);
    if (role.isSystem) {
      throw new BadRequestException('System-default roles cannot be deleted');
    }
    await this.prisma.role.delete({ where: { id } });
  }

  private async replacePermissions(roleId: string, permissionCodes: string[]) {
    const permissions = await this.prisma.permission.findMany({
      where: { code: { in: permissionCodes } },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId } }),
      this.prisma.rolePermission.createMany({
        data: permissions.map((p) => ({ roleId, permissionId: p.id })),
      }),
    ]);
  }
}

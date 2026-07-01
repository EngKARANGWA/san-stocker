import { ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import {
  DEFAULT_ROLE_TEMPLATES,
  TENANT_OWNER_ROLE_NAME,
} from '../../common/constants/default-roles.constant';
import { hashValue } from '../../common/utils/hash.util';
import { slugify } from '../../common/utils/slugify.util';
import { PrismaService } from '../../prisma/prisma.service';

export const userWithRoleInclude = {
  role: { include: { permissions: { include: { permission: true } } } },
} satisfies Prisma.UserInclude;

export interface ProvisionTenantInput {
  tenant: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
  };
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
}

/**
 * Shared transaction that creates a Tenant, its main Branch, a clone of
 * DEFAULT_ROLE_TEMPLATES (so each tenant owns an independently editable copy
 * of its roles/permissions) and the first OWNER user.
 *
 * Used by both the self-service signup flow (AuthService.registerTenant)
 * and the Super Admin "create client" flow (TenantsService.create) so the
 * provisioning logic only lives in one place.
 */
@Injectable()
export class TenantProvisioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async provisionTenant(input: ProvisionTenantInput) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: input.owner.email } });
    if (existingUser) {
      throw new ForbiddenException('A user with this email already exists');
    }

    const slug = await this.generateUniqueTenantSlug(input.tenant.name);
    const passwordHash = await hashValue(
      input.owner.password,
      this.configService.get<number>('auth.bcryptSaltRounds')!,
    );

    // Resolve the permission catalog once, outside the transaction (it's a
    // static, pre-seeded table), so the transaction itself only has to do a
    // handful of bulk writes instead of one round-trip per role template.
    // That matters over a real network hop to Neon: a per-template loop of
    // creates + lookups easily blows past Prisma's interactive-transaction
    // timeout.
    const allPermissions = await this.prisma.permission.findMany({
      select: { id: true, code: true },
    });
    const permissionIdByCode = new Map(allPermissions.map((p) => [p.code, p.id]));

    const rolesToCreate = DEFAULT_ROLE_TEMPLATES.map((template) => ({
      id: randomUUID(),
      name: template.name,
      description: template.description,
      permissions: template.permissions,
    }));
    const ownerRole = rolesToCreate.find((role) => role.name === TENANT_OWNER_ROLE_NAME);

    return this.prisma.$transaction(
      async (tx) => {
        const tenant = await tx.tenant.create({
          data: {
            name: input.tenant.name,
            slug,
            email: input.tenant.email,
            phone: input.tenant.phone,
            address: input.tenant.address,
            subscriptionPlan: input.subscriptionPlan,
            subscriptionStatus: input.subscriptionStatus,
          },
        });

        await tx.branch.create({
          data: {
            tenantId: tenant.id,
            name: `${input.tenant.name} - Main Branch`,
            code: 'MAIN',
            isMain: true,
          },
        });

        await tx.role.createMany({
          data: rolesToCreate.map((role) => ({
            id: role.id,
            tenantId: tenant.id,
            name: role.name,
            description: role.description,
            isSystem: true,
          })),
        });

        await tx.rolePermission.createMany({
          data: rolesToCreate.flatMap((role) =>
            role.permissions
              .map((code) => permissionIdByCode.get(code))
              .filter((permissionId): permissionId is string => !!permissionId)
              .map((permissionId) => ({ roleId: role.id, permissionId })),
          ),
        });

        const user = await tx.user.create({
          data: {
            tenantId: tenant.id,
            roleId: ownerRole?.id,
            firstName: input.owner.firstName,
            lastName: input.owner.lastName,
            email: input.owner.email,
            phone: input.owner.phone,
            passwordHash,
          },
          include: userWithRoleInclude,
        });

        return { tenant, user };
      },
      { timeout: 15000 },
    );
  }

  private async generateUniqueTenantSlug(name: string): Promise<string> {
    const base = slugify(name) || 'tenant';
    let candidate = base;
    let suffix = 1;

    while (await this.prisma.tenant.findUnique({ where: { slug: candidate } })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }

    return candidate;
  }
}

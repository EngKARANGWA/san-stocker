import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { REQUIRE_SUPER_ADMIN_KEY } from '../decorators/super-admin.decorator';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

/**
 * Authorization guard for DB-driven RBAC. Super Admins (SAN TECH) bypass
 * tenant-level permission checks entirely; routes marked @RequireSuperAdmin()
 * are only reachable by them.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(REQUIRE_SUPER_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requireSuperAdmin && (!requiredPermissions || requiredPermissions.length === 0)) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();
    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.isSuperAdmin) {
      return true;
    }

    if (requireSuperAdmin) {
      throw new ForbiddenException('This action is restricted to platform administrators');
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    return true;
  }
}

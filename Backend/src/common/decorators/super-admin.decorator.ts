import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SUPER_ADMIN_KEY = 'requireSuperAdmin';

/** Restricts a route to platform-level Super Admin (SAN TECH) users only. */
export const RequireSuperAdmin = () => SetMetadata(REQUIRE_SUPER_ADMIN_KEY, true);

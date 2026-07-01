export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string | null;
  branchId: string | null;
  roleId: string | null;
  isSuperAdmin: boolean;
  permissions: string[];
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  tenantId: string | null;
  branchId: string | null;
  roleId: string | null;
  isSuperAdmin: boolean;
  permissions: string[];
}

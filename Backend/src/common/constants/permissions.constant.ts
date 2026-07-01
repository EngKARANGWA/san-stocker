/**
 * Global permission catalog. Permission codes follow the `module:action`
 * convention and are seeded once (see prisma/seed.ts). Roles are granted a
 * subset of these via RolePermission, scoped per tenant.
 */

export interface PermissionDefinition {
  code: string;
  module: string;
  action: string;
  description: string;
}

const CRUD = ['create', 'read', 'update', 'delete'] as const;

function crudPermissions(module: string, label: string): PermissionDefinition[] {
  return CRUD.map((action) => ({
    code: `${module}:${action}`,
    module,
    action,
    description: `${action[0].toUpperCase()}${action.slice(1)} ${label}`,
  }));
}

function extraPermissions(
  module: string,
  actions: { action: string; description: string }[],
): PermissionDefinition[] {
  return actions.map(({ action, description }) => ({
    code: `${module}:${action}`,
    module,
    action,
    description,
  }));
}

export const PERMISSIONS: PermissionDefinition[] = [
  // Platform / tenant management (SAN TECH - Super Admin)
  ...crudPermissions('tenants', 'tenant accounts'),
  ...extraPermissions('tenants', [
    {
      action: 'manage_subscription',
      description: 'Activate, suspend or change a tenant subscription',
    },
  ]),

  ...crudPermissions('branches', 'branches'),
  ...crudPermissions('users', 'users'),
  ...crudPermissions('roles', 'roles'),
  ...extraPermissions('roles', [
    { action: 'assign_permissions', description: 'Assign permissions to a role' },
  ]),

  ...crudPermissions('categories', 'product categories'),
  ...crudPermissions('products', 'products'),
  ...crudPermissions('suppliers', 'suppliers'),

  ...crudPermissions('inventory', 'stock items'),
  ...extraPermissions('inventory', [
    { action: 'transfer', description: 'Transfer stock between branches' },
    { action: 'adjust', description: 'Adjust stock levels (stock count corrections)' },
  ]),

  ...crudPermissions('purchases', 'purchase orders'),
  ...extraPermissions('purchases', [
    { action: 'approve', description: 'Approve a purchase order' },
    { action: 'receive', description: 'Receive goods against a purchase order' },
  ]),

  ...crudPermissions('sales', 'sales / POS transactions'),
  ...extraPermissions('sales', [
    { action: 'refund', description: 'Refund or void a sale' },
    { action: 'discount', description: 'Apply a discount to a sale' },
  ]),

  ...crudPermissions('customers', 'customers'),

  ...crudPermissions('finance', 'financial records'),
  ...crudPermissions('hr', 'employee records'),
  ...crudPermissions('payroll', 'payroll'),
  ...crudPermissions('loyalty', 'loyalty programs'),
  ...crudPermissions('promotions', 'promotions and discounts'),
  ...crudPermissions('delivery', 'deliveries'),
  ...crudPermissions('warehouse', 'warehouse operations'),

  ...extraPermissions('reports', [
    { action: 'view_sales', description: 'View sales reports' },
    { action: 'view_financial', description: 'View financial reports' },
    { action: 'view_inventory', description: 'View inventory reports' },
  ]),

  ...extraPermissions('audit', [{ action: 'read', description: 'View audit logs' }]),
  ...extraPermissions('settings', [{ action: 'manage', description: 'Manage system settings' }]),
];

export const PERMISSION_CODES = PERMISSIONS.map((p) => p.code);

import { PERMISSIONS } from './permissions.constant';

/**
 * Default role templates, derived from the SAN PRO role/responsibility
 * matrix. Cloned (Role + RolePermission rows) into every new tenant by
 * TenantsService so each tenant can later customize its own copy without
 * affecting other tenants.
 */

export interface DefaultRoleTemplate {
  name: string;
  description: string;
  permissions: string[];
}

function codesByModule(modules: string[], actions?: string[]): string[] {
  return PERMISSIONS.filter(
    (p) => modules.includes(p.module) && (!actions || actions.includes(p.action)),
  ).map((p) => p.code);
}

function allCodesExceptModules(excludedModules: string[]): string[] {
  return PERMISSIONS.filter((p) => !excludedModules.includes(p.module)).map((p) => p.code);
}

function allReadOnlyCodes(): string[] {
  return PERMISSIONS.filter((p) => p.action === 'read' || p.action.startsWith('view_')).map(
    (p) => p.code,
  );
}

export const DEFAULT_ROLE_TEMPLATES: DefaultRoleTemplate[] = [
  {
    name: 'SYSTEM_ADMINISTRATOR',
    description:
      'Manages users, roles, permissions, system settings, backups and security. Full access within the tenant.',
    permissions: allCodesExceptModules(['tenants']),
  },
  {
    name: 'OWNER',
    description:
      'Views business performance, sales/financial reports, inventory status, and approves major decisions.',
    permissions: [
      ...codesByModule(['branches', 'users', 'roles'], ['read']),
      ...codesByModule(['products', 'categories', 'suppliers', 'customers'], ['read']),
      ...codesByModule(['inventory', 'purchases', 'sales', 'finance', 'hr', 'payroll'], ['read']),
      ...codesByModule(['loyalty', 'promotions', 'delivery', 'warehouse'], ['read']),
      'purchases:approve',
      ...codesByModule(['reports'], ['view_sales', 'view_financial', 'view_inventory']),
    ],
  },
  {
    name: 'STORE_MANAGER',
    description:
      'Manages daily operations of a branch: staff, inventory, sales, discounts and returns.',
    permissions: [
      ...codesByModule(['branches'], ['read', 'update']),
      ...codesByModule(['users'], ['read']),
      ...codesByModule(['products', 'categories'], ['create', 'read', 'update']),
      ...codesByModule(['suppliers'], ['read']),
      ...codesByModule(['inventory'], ['create', 'read', 'update', 'transfer', 'adjust']),
      ...codesByModule(['purchases'], ['create', 'read', 'update', 'approve', 'receive']),
      ...codesByModule(['sales'], ['create', 'read', 'update', 'refund', 'discount']),
      ...codesByModule(['customers'], ['create', 'read', 'update']),
      ...codesByModule(['promotions'], ['create', 'read', 'update']),
      ...codesByModule(['reports'], ['view_sales', 'view_inventory']),
    ],
  },
  {
    name: 'CASHIER',
    description: 'Processes purchases, receives payments, prints receipts, opens/closes register.',
    permissions: [
      ...codesByModule(['products'], ['read']),
      ...codesByModule(['sales'], ['create', 'read']),
      ...codesByModule(['customers'], ['create', 'read']),
    ],
  },
  {
    name: 'INVENTORY_MANAGER',
    description: 'Monitors stock levels, receives goods, conducts stock counts and adjustments.',
    permissions: [
      ...codesByModule(['products'], ['read', 'update']),
      ...codesByModule(['inventory'], ['create', 'read', 'update', 'transfer', 'adjust']),
      ...codesByModule(['purchases'], ['read', 'receive']),
      ...codesByModule(['warehouse'], ['create', 'read', 'update']),
      ...codesByModule(['reports'], ['view_inventory']),
    ],
  },
  {
    name: 'PROCUREMENT_OFFICER',
    description: 'Creates purchase orders, manages suppliers, tracks deliveries.',
    permissions: [
      ...codesByModule(['suppliers'], ['create', 'read', 'update', 'delete']),
      ...codesByModule(['purchases'], ['create', 'read', 'update', 'approve']),
      ...codesByModule(['products'], ['read']),
    ],
  },
  {
    name: 'WAREHOUSE_OFFICER',
    description: 'Receives goods, verifies deliveries, stores products, issues stock to shelves.',
    permissions: [
      ...codesByModule(['inventory'], ['read', 'update', 'transfer', 'adjust']),
      ...codesByModule(['warehouse'], ['create', 'read', 'update']),
      ...codesByModule(['purchases'], ['read', 'receive']),
    ],
  },
  {
    name: 'SALES_SUPERVISOR',
    description: 'Monitors sales activities, supervises cashiers, reviews daily sales reports.',
    permissions: [
      ...codesByModule(['sales'], ['read', 'refund', 'discount']),
      ...codesByModule(['customers'], ['read']),
      ...codesByModule(['users'], ['read']),
      ...codesByModule(['reports'], ['view_sales']),
    ],
  },
  {
    name: 'SHELF_ATTENDANT',
    description:
      'Arranges products, checks availability, replaces expired products, updates labels.',
    permissions: [
      ...codesByModule(['products'], ['read', 'update']),
      ...codesByModule(['inventory'], ['read']),
    ],
  },
  {
    name: 'CUSTOMER_SERVICE_OFFICER',
    description: 'Handles complaints, returns, exchanges, loyalty programs and inquiries.',
    permissions: [
      ...codesByModule(['customers'], ['create', 'read', 'update']),
      ...codesByModule(['loyalty'], ['create', 'read', 'update']),
      ...codesByModule(['sales'], ['read', 'refund']),
    ],
  },
  {
    name: 'ACCOUNTANT',
    description:
      'Manages payments, expenses, invoices, financial reports, taxes, payroll integration.',
    permissions: [
      ...codesByModule(['finance'], ['create', 'read', 'update', 'delete']),
      ...codesByModule(['suppliers', 'purchases', 'sales'], ['read']),
      ...codesByModule(['payroll'], ['read']),
      ...codesByModule(['reports'], ['view_financial', 'view_sales']),
    ],
  },
  {
    name: 'HR_OFFICER',
    description:
      'Manages employee records, attendance, leave, payroll information and recruitment.',
    permissions: [
      ...codesByModule(['hr'], ['create', 'read', 'update', 'delete']),
      ...codesByModule(['payroll'], ['create', 'read', 'update']),
      ...codesByModule(['users'], ['read']),
    ],
  },
  {
    name: 'MARKETING_OFFICER',
    description: 'Creates promotions, discount campaigns, loyalty programs and analyzes trends.',
    permissions: [
      ...codesByModule(['promotions'], ['create', 'read', 'update', 'delete']),
      ...codesByModule(['loyalty'], ['create', 'read', 'update', 'delete']),
      ...codesByModule(['customers'], ['read']),
      ...codesByModule(['reports'], ['view_sales']),
    ],
  },
  {
    name: 'AUDITOR',
    description:
      'Reviews financial records, stock movements, transaction history and logs (read-only).',
    permissions: allReadOnlyCodes(),
  },
  {
    name: 'SECURITY_OFFICER',
    description: 'Monitors access logs and reports security incidents.',
    permissions: [
      ...codesByModule(['audit'], ['read']),
      ...codesByModule(['users', 'inventory'], ['read']),
    ],
  },
];

export const TENANT_OWNER_ROLE_NAME = 'OWNER';

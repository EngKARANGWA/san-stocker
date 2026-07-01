# SAN Stocker Backend

Multi-tenant supermarket / retail management API built with **NestJS**, **Prisma** and **Neon (serverless Postgres)**.

One deployment serves every client business (tenant). **SAN TECH (Super Admin)** manages tenants and their subscriptions; everything else (branches, users, roles, products, inventory, purchasing, POS, customers...) is scoped to a tenant via `tenantId`.

## Architecture

```
src/
  common/            cross-cutting code: guards, decorators, filters, interceptors, DTOs, constants
    constants/       global permission catalog + default role templates (cloned per tenant)
    decorators/      @Public, @RequirePermissions, @RequireSuperAdmin, @CurrentUser
    guards/          JwtAuthGuard, PermissionsGuard (DB-driven RBAC, checked against the JWT)
    filters/         HTTP + Prisma exception -> consistent error responses
    interceptors/    response envelope ({ success, data })
  config/            typed configuration + env validation
  prisma/            PrismaService / PrismaModule (Neon Postgres client)
  modules/
    auth/            login, refresh, self-service tenant signup, change-password
    tenants/         Super Admin: client onboarding + subscription management
    branches/        per-tenant branches
    users/ roles/ permissions/   tenant-scoped user & RBAC management
    categories/ products/ suppliers/   catalog
    inventory/       per-branch stock levels, adjustments, transfers, movement ledger
    purchases/       purchase orders: draft -> approve -> receive (writes stock-in movements)
    sales/           POS: sale creation (stock-out + loyalty points), refunds
    customers/       tenant customers
    reports/         sales & inventory summaries
    audit-logs/      read-only audit trail
    finance/ hr/ payroll/ loyalty/ promotions/ delivery/ warehouse/ system-settings/
                     scaffolded module skeletons (see each service file for what's needed next)
prisma/
  schema.prisma      data model
  seed.ts            seeds the permission catalog + the platform Super Admin account
```

### Multi-tenancy

Every tenant-scoped table carries a `tenantId`. Every tenant-scoped service method takes `tenantId` as
its first argument and every controller pulls it from the authenticated user's JWT
(`@CurrentUser() user.tenantId`) — never from client input — so one tenant can never read or write another
tenant's data.

### RBAC

- `Permission` is a global catalog (`module:action`, e.g. `products:create`) seeded once via `prisma/seed.ts`.
- `Role` is owned by a tenant. When a tenant is created (self-service signup or Super Admin "create client"),
  the full set of default role templates in `src/common/constants/default-roles.constant.ts` (derived from the
  SAN PRO role/responsibility matrix) is cloned into that tenant so it can be edited independently.
- A user's permissions are embedded in their JWT at login/refresh time and checked by `PermissionsGuard`
  against `@RequirePermissions(...)` on each route. Routes under `@RequireSuperAdmin()` are only reachable
  by platform-level Super Admin (SAN TECH) accounts (`tenantId = null`, `isSuperAdmin = true`).

## Getting started

### 1. Provision a Neon Postgres database

Create a project at [neon.tech](https://neon.tech) and copy the **pooled** connection string (for `DATABASE_URL`)
and the **direct** connection string (for `DIRECT_URL`, used by Prisma Migrate).

### 2. Configure environment

```bash
cp .env.example .env
# fill in DATABASE_URL, DIRECT_URL, JWT secrets, SUPER_ADMIN_* credentials
```

### 3. Install dependencies

```bash
npm install
```

### 4. Run migrations and seed

```bash
npm run prisma:migrate     # creates tables in Neon
npm run prisma:seed        # seeds the permission catalog + the SAN TECH super admin account
```

### 5. Start the API

```bash
npm run start:dev
```

The API is served under `http://localhost:3000/api/v1` (configurable via `PORT` / `API_PREFIX`).
Swagger docs are available at `http://localhost:3000/api/v1/docs`.

## Typical flow

1. **Super Admin** logs in with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` via `POST /auth/login`.
2. Either:
   - a business self-registers via `POST /auth/register-tenant` (creates a `TRIALING` tenant), or
   - the Super Admin onboards a client directly via `POST /tenants` (with an initial `subscriptionPlan`).
3. The Super Admin manages the subscription lifecycle via `PATCH /tenants/:id/subscription`,
   `PATCH /tenants/:id/deactivate` / `reactivate`.
4. The tenant's `OWNER` user logs in and creates branches, invites staff (`POST /users`, assigning one of the
   cloned default roles or a custom role created via `POST /roles`), and builds out the product catalog,
   suppliers, purchasing and POS operations.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Run with hot-reload |
| `npm run build` | Compile to `dist/` |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests |
| `npm run prisma:migrate` | Create/apply a migration (dev) |
| `npm run prisma:migrate:deploy` | Apply migrations (prod) |
| `npm run prisma:studio` | Browse the database |
| `npm run prisma:seed` | Re-run the seed script |

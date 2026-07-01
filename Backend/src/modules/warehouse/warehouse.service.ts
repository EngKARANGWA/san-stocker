import { Injectable } from '@nestjs/common';

/**
 * Scaffolded module for Warehouse Management. Stock receiving, transfers and
 * adjustments already live in InventoryModule; this module is reserved for
 * warehouse-specific concerns (storage locations/bins, putaway tasks) once
 * those Prisma models are added.
 */
@Injectable()
export class WarehouseService {}

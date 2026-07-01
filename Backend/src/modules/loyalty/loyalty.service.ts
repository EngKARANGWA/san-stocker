import { Injectable } from '@nestjs/common';

/**
 * Scaffolded module for Loyalty Programs (coupons, membership tiers,
 * point-redemption rules). Customer.loyaltyPoints is already accrued by
 * SalesService; this module will own redemption and tier/coupon management
 * once those Prisma models are added.
 */
@Injectable()
export class LoyaltyService {}

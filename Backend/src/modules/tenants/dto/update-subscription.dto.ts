import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export class UpdateSubscriptionDto {
  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.STANDARD, required: false })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;

  @ApiProperty({ enum: SubscriptionStatus, example: SubscriptionStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(SubscriptionStatus)
  subscriptionStatus?: SubscriptionStatus;

  @ApiProperty({ example: '2026-07-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  subscriptionStartsAt?: string;

  @ApiProperty({ example: '2027-07-01T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  subscriptionEndsAt?: string;
}

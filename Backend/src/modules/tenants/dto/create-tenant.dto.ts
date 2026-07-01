import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
import { SubscriptionPlan } from '@prisma/client';

class TenantInfoDto {
  @ApiProperty({ example: 'Kigali Fresh Mart' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'info@kigalifresh.rw', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '0788123456', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'KN 4 Ave, Kigali', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

class OwnerInfoDto {
  @ApiProperty({ example: 'Jean' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Mugisha' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'owner@kigalifresh.rw' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '0788654321', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'OwnerPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

/** Used by SAN TECH (Super Admin) to onboard a new client business directly. */
export class CreateTenantDto {
  @ApiProperty({ type: TenantInfoDto })
  @ValidateNested()
  @Type(() => TenantInfoDto)
  tenant!: TenantInfoDto;

  @ApiProperty({ type: OwnerInfoDto })
  @ValidateNested()
  @Type(() => OwnerInfoDto)
  owner!: OwnerInfoDto;

  @ApiProperty({ enum: SubscriptionPlan, example: SubscriptionPlan.STANDARD, required: false })
  @IsOptional()
  @IsEnum(SubscriptionPlan)
  subscriptionPlan?: SubscriptionPlan;
}

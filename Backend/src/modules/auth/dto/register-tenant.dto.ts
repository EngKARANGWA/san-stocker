import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

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

/**
 * Self-service signup for a new client business. Creates a Tenant in
 * TRIALING status, its main Branch, the default role set (cloned from
 * DEFAULT_ROLE_TEMPLATES) and the first user as OWNER.
 * SAN TECH (Super Admin) later manages the subscription via TenantsModule.
 */
export class RegisterTenantDto {
  @ApiProperty({ type: TenantInfoDto })
  @ValidateNested()
  @Type(() => TenantInfoDto)
  tenant!: TenantInfoDto;

  @ApiProperty({ type: OwnerInfoDto })
  @ValidateNested()
  @Type(() => OwnerInfoDto)
  owner!: OwnerInfoDto;
}

import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'NIGHT_SHIFT_CASHIER' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'Cashier role restricted to the night shift counter', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Permission codes from GET /permissions to grant this role',
    example: ['sales:create', 'sales:read', 'customers:read'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes?: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ example: 'NIGHT_SHIFT_CASHIER', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: 'Cashier role restricted to the night shift counter', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

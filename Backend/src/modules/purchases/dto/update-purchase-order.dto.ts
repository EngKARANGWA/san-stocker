import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseOrderDto {
  @ApiProperty({ example: '2026-07-05T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @ApiProperty({ example: 'Supplier confirmed delivery for Monday', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

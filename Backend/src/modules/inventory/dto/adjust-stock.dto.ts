import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum StockAdjustmentDirection {
  IN = 'IN',
  OUT = 'OUT',
}

export class AdjustStockDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'Product id' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '2ad850a2-6681-43e4-9e9a-bb7febdf943f', description: 'Branch id' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 5, description: 'Number of units to add or remove' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ enum: StockAdjustmentDirection, example: StockAdjustmentDirection.OUT })
  @IsEnum(StockAdjustmentDirection)
  direction!: StockAdjustmentDirection;

  @ApiProperty({ example: 'Damaged during shelving', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class PurchaseOrderItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(1)
  quantityOrdered!: number;

  @ApiProperty({
    example: 480,
    description: 'Cost per unit agreed with the supplier for this order',
  })
  @IsNumber()
  @Min(0)
  unitCost!: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({
    description: 'Branch the goods will be delivered to',
    example: '2ad850a2-6681-43e4-9e9a-bb7febdf943f',
  })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID()
  supplierId!: string;

  @ApiProperty({ example: '2026-07-05T00:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @ApiProperty({ example: 'Monthly beverage restock', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PurchaseOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  items!: PurchaseOrderItemDto[];
}

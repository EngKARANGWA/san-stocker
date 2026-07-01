import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Coca-Cola 500ml' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'BEV-COKE-500' })
  @IsString()
  sku!: string;

  @ApiProperty({ example: '5449000000996', required: false })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiProperty({ example: 'bottle', default: 'pcs', required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ example: 500, description: 'Cost price your business pays per unit' })
  @IsNumber()
  @Min(0)
  costPrice!: number;

  @ApiProperty({ example: 800, description: 'Price charged to customers per unit' })
  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @ApiProperty({
    example: 20,
    description: 'Stock level at which this product should be reordered',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reorderLevel?: number;

  @ApiProperty({
    description: 'Category id from GET /categories',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({
    description: 'Supplier id from GET /suppliers',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  supplierId?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class TransferStockDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'Product id' })
  @IsUUID()
  productId!: string;

  @ApiProperty({ example: '2ad850a2-6681-43e4-9e9a-bb7febdf943f', description: 'Source branch id' })
  @IsUUID()
  fromBranchId!: string;

  @ApiProperty({
    example: 'b4f3c2a1-1234-4abc-9def-0123456789ab',
    description: 'Destination branch id',
  })
  @IsUUID()
  toBranchId!: string;

  @ApiProperty({ example: 10, description: 'Number of units to move' })
  @IsInt()
  @Min(1)
  quantity!: number;

  @ApiProperty({ example: 'Restocking Remera branch', required: false })
  @IsOptional()
  @IsString()
  note?: string;
}

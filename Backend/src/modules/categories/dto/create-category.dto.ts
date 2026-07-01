import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Beverages' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'Soft drinks, juices and water', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Parent category id, to nest this category (e.g. "Soft Drinks" under "Beverages")',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

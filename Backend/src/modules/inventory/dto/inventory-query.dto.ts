import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InventoryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter to a single branch',
    example: '2ad850a2-6681-43e4-9e9a-bb7febdf943f',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

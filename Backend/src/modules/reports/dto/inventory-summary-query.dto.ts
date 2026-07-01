import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class InventorySummaryQueryDto {
  @ApiPropertyOptional({ example: '2ad850a2-6681-43e4-9e9a-bb7febdf943f' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

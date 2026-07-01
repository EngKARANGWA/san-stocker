import { ApiPropertyOptional } from '@nestjs/swagger';
import { SaleStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class SaleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '2ad850a2-6681-43e4-9e9a-bb7febdf943f' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: SaleStatus, example: SaleStatus.COMPLETED })
  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;
}

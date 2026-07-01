import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Remera Branch' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'REMERA-01' })
  @IsString()
  code!: string;

  @ApiProperty({ example: 'KG 11 Ave, Remera, Kigali', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: '0788111222', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;
}

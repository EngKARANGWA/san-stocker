import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSupplierDto {
  @ApiProperty({ example: 'Bralirwa Ltd' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ example: 'Eric Niyonsenga', required: false })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiProperty({ example: 'sales@bralirwa.rw', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '0788222333', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Nyacyonga, Gasabo, Kigali', required: false })
  @IsOptional()
  @IsString()
  address?: string;
}

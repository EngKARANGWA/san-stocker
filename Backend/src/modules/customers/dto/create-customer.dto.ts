import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Grace' })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({ example: 'Ingabire', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'grace.ingabire@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '0788445566', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

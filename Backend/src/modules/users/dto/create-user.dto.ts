import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Alice' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Uwase' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: 'alice.cashier@kigalifresh.rw' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '0788999111', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'TempPass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    description: 'Role id from GET /roles - e.g. the cloned CASHIER role for this tenant',
    example: '8c1b6e2a-2f1e-4a3a-9b8a-5e6f7a8b9c0d',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  roleId?: string;

  @ApiProperty({
    description: 'Branch id from GET /branches',
    example: '2ad850a2-6681-43e4-9e9a-bb7febdf943f',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}

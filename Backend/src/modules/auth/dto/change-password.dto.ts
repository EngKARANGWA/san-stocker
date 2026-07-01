import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'Cyrille123$' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewPassword456#', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Email address or phone number registered to the account',
    example: 'karangwacyrille@gmail.com',
  })
  @IsString()
  @MinLength(3)
  identifier!: string;

  @ApiProperty({ example: 'Cyrille123$' })
  @IsString()
  @MinLength(1)
  password!: string;
}

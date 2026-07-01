import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'The refreshToken returned by /auth/login or /auth/refresh' })
  @IsString()
  refreshToken!: string;
}

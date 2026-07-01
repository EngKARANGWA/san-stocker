import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description:
      "The Google ID token obtained client-side from the device's already-signed-in Google account (Google Sign-In / One Tap)",
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  idToken!: string;
}

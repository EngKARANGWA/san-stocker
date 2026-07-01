import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Full replacement set of permission codes for this role (from GET /permissions)',
    example: ['sales:create', 'sales:read', 'sales:discount', 'customers:read'],
  })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissionCodes!: string[];
}

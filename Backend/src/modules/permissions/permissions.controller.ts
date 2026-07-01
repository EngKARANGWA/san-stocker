import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionsService } from './permissions.service';

/** Read-only catalog of every permission code in the system; used when assigning permissions to a role. */
@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @ApiOperation({
    summary: 'List the full permission catalog',
    description:
      'Use the returned `code` values when creating/updating roles via POST /roles or PATCH /roles/:id/permissions.',
  })
  @RequirePermissions('roles:read')
  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }
}

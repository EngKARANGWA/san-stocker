import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesService } from './roles.service';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @ApiOperation({ summary: 'Create a custom role for the current tenant' })
  @RequirePermissions('roles:create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user.tenantId!, dto);
  }

  @ApiOperation({
    summary: 'List all roles for the current tenant (including the cloned defaults)',
  })
  @RequirePermissions('roles:read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.findAll(user.tenantId!);
  }

  @ApiOperation({ summary: 'Get a role and its granted permissions' })
  @RequirePermissions('roles:read')
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.rolesService.findOne(user.tenantId!, id);
  }

  @ApiOperation({ summary: 'Rename/redescribe a role' })
  @RequirePermissions('roles:update')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(user.tenantId!, id, dto);
  }

  @ApiOperation({ summary: 'Replace the full set of permissions granted to a role' })
  @RequirePermissions('roles:assign_permissions')
  @Patch(':id/permissions')
  assignPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
  ) {
    return this.rolesService.assignPermissions(user.tenantId!, id, dto);
  }

  @ApiOperation({ summary: 'Delete a custom role (system/default roles cannot be deleted)' })
  @RequirePermissions('roles:delete')
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.rolesService.remove(user.tenantId!, id);
  }
}

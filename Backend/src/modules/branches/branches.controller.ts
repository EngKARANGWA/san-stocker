import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@ApiTags('branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @ApiOperation({ summary: 'Create a branch for the current tenant' })
  @RequirePermissions('branches:create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user.tenantId!, dto);
  }

  @ApiOperation({ summary: 'List all branches for the current tenant' })
  @RequirePermissions('branches:read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.branchesService.findAll(user.tenantId!);
  }

  @ApiOperation({ summary: 'Get a branch by id' })
  @RequirePermissions('branches:read')
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.branchesService.findOne(user.tenantId!, id);
  }

  @ApiOperation({ summary: 'Update a branch' })
  @RequirePermissions('branches:update')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branchesService.update(user.tenantId!, id, dto);
  }

  @ApiOperation({ summary: 'Deactivate a branch' })
  @RequirePermissions('branches:delete')
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.branchesService.remove(user.tenantId!, id);
  }
}

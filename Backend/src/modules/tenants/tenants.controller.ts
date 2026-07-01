import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireSuperAdmin } from '../../common/decorators/super-admin.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsService } from './tenants.service';

/**
 * Platform-level client management for SAN TECH (Super Admin): every route
 * here is restricted to Super Admin users via @RequireSuperAdmin().
 */
@ApiTags('tenants')
@ApiBearerAuth()
@RequireSuperAdmin()
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @ApiOperation({
    summary: '[Super Admin] Onboard a new client business',
    description:
      'Creates the Tenant, its main Branch, default roles and the OWNER user in one step.',
  })
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @ApiOperation({ summary: '[Super Admin] List all client businesses' })
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.tenantsService.findAll(query);
  }

  @ApiOperation({ summary: '[Super Admin] Get a client business by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @ApiOperation({ summary: '[Super Admin] Update a client business profile' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @ApiOperation({ summary: '[Super Admin] Change a client subscription plan/status/dates' })
  @Patch(':id/subscription')
  updateSubscription(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.tenantsService.updateSubscription(id, dto);
  }

  @ApiOperation({ summary: '[Super Admin] Deactivate a client business (data is retained)' })
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.tenantsService.deactivate(id);
  }

  @ApiOperation({ summary: '[Super Admin] Reactivate a previously deactivated client business' })
  @Patch(':id/reactivate')
  reactivate(@Param('id') id: string) {
    return this.tenantsService.reactivate(id);
  }
}

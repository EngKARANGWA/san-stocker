import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @ApiOperation({ summary: 'Register a customer' })
  @RequirePermissions('customers:create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.tenantId!, dto);
  }

  @ApiOperation({ summary: 'List customers (paginated, searchable by name/phone/email)' })
  @RequirePermissions('customers:read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
    return this.customersService.findAll(user.tenantId!, query);
  }

  @ApiOperation({ summary: 'Get a customer by id, including loyalty points balance' })
  @RequirePermissions('customers:read')
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.findOne(user.tenantId!, id);
  }

  @ApiOperation({ summary: 'Update a customer' })
  @RequirePermissions('customers:update')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.tenantId!, id, dto);
  }

  @ApiOperation({ summary: 'Deactivate a customer' })
  @RequirePermissions('customers:delete')
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.remove(user.tenantId!, id);
  }
}

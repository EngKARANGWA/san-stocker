import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: 'Create a product category (optionally nested under a parent)' })
  @RequirePermissions('categories:create')
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user.tenantId!, dto);
  }

  @ApiOperation({ summary: 'List all categories for the current tenant' })
  @RequirePermissions('categories:read')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.findAll(user.tenantId!);
  }

  @ApiOperation({ summary: 'Get a category by id' })
  @RequirePermissions('categories:read')
  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.categoriesService.findOne(user.tenantId!, id);
  }

  @ApiOperation({ summary: 'Update a category' })
  @RequirePermissions('categories:update')
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.tenantId!, id, dto);
  }

  @ApiOperation({ summary: 'Delete a category' })
  @RequirePermissions('categories:delete')
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.categoriesService.remove(user.tenantId!, id);
  }
}

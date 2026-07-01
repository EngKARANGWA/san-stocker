import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({
    summary: 'Sign up a new client business',
    description:
      'Self-service onboarding: creates a Tenant (TRIALING subscription), its main Branch, the default set of roles cloned from the SAN PRO role matrix, and the first user as OWNER. No authentication required.',
  })
  @Public()
  @Post('register-tenant')
  registerTenant(@Body() dto: RegisterTenantDto) {
    return this.authService.registerTenant(dto);
  }

  @ApiOperation({
    summary: 'Log in with email or phone + password',
    description:
      'Returns an access token (15 min) and a refresh token (7 days). No authentication required.',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'Continue with Google',
    description:
      "Verifies a Google ID token from the device's already-signed-in Google account and logs in the matching existing user. Does not create new accounts - the business must already be registered. No authentication required.",
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google')
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.idToken);
  }

  @ApiOperation({
    summary: 'Exchange a refresh token for a new token pair',
    description:
      'The refresh token used is revoked and replaced (single-use rotation). No authentication required.',
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Revoke a refresh token (log out of one session)' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@CurrentUser() user: AuthenticatedUser, @Body() dto: RefreshTokenDto) {
    return this.authService.logout(user.id, dto.refreshToken);
  }

  @ApiOperation({ summary: 'Get the current authenticated user profile + permissions' })
  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @ApiOperation({ summary: 'Change the current user password (revokes all refresh tokens)' })
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto);
  }
}

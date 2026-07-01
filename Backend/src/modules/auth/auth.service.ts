import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { compareHash, hashValue } from '../../common/utils/hash.util';
import { PrismaService } from '../../prisma/prisma.service';
import {
  TenantProvisioningService,
  userWithRoleInclude,
} from '../tenants/tenant-provisioning.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';

type UserWithRole = User & {
  role: { id: string; permissions: { permission: { code: string } }[] } | null;
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tenantProvisioningService: TenantProvisioningService,
  ) {}

  async registerTenant(dto: RegisterTenantDto) {
    const { tenant, user } = await this.tenantProvisioningService.provisionTenant({
      tenant: dto.tenant,
      owner: dto.owner,
    });

    const tokens = await this.issueTokens(user);
    return { tenant, user: this.sanitizeUser(user), ...tokens };
  }

  /** `dto.identifier` is either an email address or a phone number. */
  async login(dto: LoginDto) {
    const isEmail = dto.identifier.includes('@');
    const user = await this.prisma.user.findUnique({
      where: isEmail ? { email: dto.identifier } : { phone: dto.identifier },
      include: userWithRoleInclude,
    });

    if (!user || !(await compareHash(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.finalizeLogin(user);
  }

  /**
   * Verifies a Google ID token obtained client-side (e.g. from the Google
   * account already signed in on the user's device / "Continue with
   * Google") and logs in the matching SAN Stocker account. Does not create
   * new accounts - a business must already exist (via registerTenant or an
   * invited user) before Google sign-in can be used against it.
   */
  async loginWithGoogle(idToken: string) {
    const allowedClientIds = this.configService.get<string[]>('google.clientIds') ?? [];
    if (allowedClientIds.length === 0) {
      throw new ForbiddenException('Google sign-in is not configured on this server');
    }

    const client = new OAuth2Client();
    let payload: { email?: string; email_verified?: boolean; sub: string } | undefined;
    try {
      const ticket = await client.verifyIdToken({ idToken, audience: allowedClientIds });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    if (!payload?.email || !payload.email_verified) {
      throw new UnauthorizedException('Google account email is not verified');
    }

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId: payload.sub }, { email: payload.email }] },
      include: userWithRoleInclude,
    });

    if (!user) {
      throw new UnauthorizedException(
        'No SAN Stocker account found for this Google account. Please register your business first.',
      );
    }

    if (!user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
        include: userWithRoleInclude,
      });
    }

    return this.finalizeLogin(user);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('auth.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    let matched: (typeof storedTokens)[number] | undefined;
    for (const stored of storedTokens) {
      if (await compareHash(refreshToken, stored.tokenHash)) {
        matched = stored;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException('Refresh token has been revoked or is invalid');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: userWithRoleInclude,
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is no longer active');
    }

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(user);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revokedAt: null },
    });

    for (const stored of storedTokens) {
      if (await compareHash(refreshToken, stored.tokenHash)) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        });
        return;
      }
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: userWithRoleInclude,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await compareHash(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await hashValue(
      dto.newPassword,
      this.configService.get<number>('auth.bcryptSaltRounds')!,
    );
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async assertUserIsActive(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or no longer exists');
    }
  }

  private async finalizeLogin(user: UserWithRole) {
    if (!user.isActive) {
      throw new ForbiddenException('This account has been deactivated');
    }

    if (user.tenantId) {
      const tenant = await this.prisma.tenant.findUnique({ where: { id: user.tenantId } });
      if (!tenant?.isActive || ['SUSPENDED', 'CANCELLED'].includes(tenant.subscriptionStatus)) {
        throw new ForbiddenException('This business account is not currently active');
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  private async issueTokens(user: UserWithRole): Promise<AuthTokens> {
    const permissions = user.role?.permissions.map((rp) => rp.permission.code) ?? [];

    const basePayload: Omit<JwtPayload, 'sub'> = {
      email: user.email,
      tenantId: user.tenantId,
      branchId: user.branchId,
      roleId: user.roleId,
      isSuperAdmin: user.isSuperAdmin,
      permissions,
    };

    const jti = randomUUID();
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, ...basePayload },
      {
        secret: this.configService.get<string>('auth.accessSecret'),
        expiresIn: this.configService.get<string>('auth.accessExpiresIn'),
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, ...basePayload, jti },
      {
        secret: this.configService.get<string>('auth.refreshSecret'),
        expiresIn: this.configService.get<string>('auth.refreshExpiresIn'),
      },
    );

    await this.persistRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  private async persistRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const decoded = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 7 * 86400_000);
    const tokenHash = await hashValue(
      refreshToken,
      this.configService.get<number>('auth.bcryptSaltRounds')!,
    );

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  }

  private sanitizeUser(user: UserWithRole) {
    const { passwordHash: _passwordHash, role, ...rest } = user;
    return {
      ...rest,
      permissions: role?.permissions.map((rp) => rp.permission.code) ?? [],
    };
  }
}

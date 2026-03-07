import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserEntity } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET ?? 'secretKey',
      expiresIn: '15m',
    });

    const rawRefreshToken = uuidv4();
    const hashedRefreshToken = await bcrypt.hash(rawRefreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: { token: hashedRefreshToken, userId, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  async register(registerDto: RegisterDto) {
    const { email, username, password, phoneNumber } = registerDto;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or phone number already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, username, phoneNumber, password: hashedPassword },
    });

    await this.prisma.financialProfile.create({
      data: { userId: user.id },
    });

    return new UserEntity(user);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    return { user: new UserEntity(user), ...tokens };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { isRevoked: false, expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    let matchedToken: (typeof storedTokens)[number] | undefined;

    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, stored.token);
      if (isMatch) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke old token (rotation)
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { isRevoked: true },
    });

    const { user } = matchedToken;
    return this.generateTokens(user.id, user.email, user.role);
  }

  async logout(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { isRevoked: false },
    });

    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, stored.token);
      if (isMatch) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { isRevoked: true },
        });
        return { message: 'Logged out successfully' };
      }
    }

    throw new UnauthorizedException('Invalid refresh token');
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
    return { message: 'Logged out from all devices' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return null;
  }
}

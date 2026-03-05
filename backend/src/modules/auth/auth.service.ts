import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../core/prisma/prisma.service';
import type { RegisterDto } from './dto';
import type { AuthResponse } from './interfaces';

type UserData = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) { }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, username, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true,
          avatarUrl: true,
        },
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      // Save refresh token
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          ...user,
          avatarUrl: user.avatarUrl ?? undefined,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async login(user: UserData): Promise<AuthResponse> {
    const tokens = await this.generateTokens(user);

    // Update refresh token and last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(tokens.refreshToken, 10),
        lastLoginAt: new Date(),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatarUrl: user.avatarUrl ?? undefined,
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<Omit<
    Awaited<ReturnType<typeof this.prisma.user.findFirst>>,
    'password'
  > | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!user || !user.password) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = user;
    return result;
  }

  async validateOAuthUser(profile: {
    githubId: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
    githubAccessToken?: string;
  }): Promise<
    Omit<
      Awaited<ReturnType<typeof this.prisma.user.findUnique>>,
      'password' | 'refreshToken'
    >
  > {
    // Try to find user by GitHub ID
    let user = await this.prisma.user.findUnique({
      where: { githubId: profile.githubId },
    });

    if (user) {
      // Update last login and GitHub access token
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          githubAccessToken: profile.githubAccessToken,
        },
      });
    } else {
      // Try to find by email
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link GitHub account to existing user
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            githubId: profile.githubId,
            githubAccessToken: profile.githubAccessToken,
            lastLoginAt: new Date(),
          },
        });
      } else {
        // Create new user
        // Ensure unique username
        let username = profile.username;
        let counter = 1;
        while (await this.prisma.user.findUnique({ where: { username } })) {
          username = `${profile.username}${counter}`;
          counter++;
        }

        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            username,
            firstName: profile.firstName,
            lastName: profile.lastName,
            githubId: profile.githubId,
            githubAccessToken: profile.githubAccessToken,
            avatarUrl: profile.avatarUrl,
            isVerified: true, // Auto-verify OAuth users
            lastLoginAt: new Date(),
          },
        });
      }
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private async generateTokens(user: {
    id: string;
    username: string;
    email: string;
    role: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    // Access Token - chứa thông tin đầy đủ
    const accessTokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Refresh Token - chỉ chứa userId và type
    const refreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
    };

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET');
    const jwtExpiration =
      this.configService.get<string>('JWT_EXPIRATION') || '15m';
    const jwtRefreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    // Tạo Access Token với JWT_SECRET
    const accessToken: string = await this.jwtService.signAsync(
      accessTokenPayload,
      {
        secret: jwtSecret,
        expiresIn: jwtExpiration,
      } as never,
    );

    // Tạo Refresh Token với JWT_REFRESH_SECRET (secret khác)
    const refreshToken: string = await this.jwtService.signAsync(
      refreshTokenPayload,
      {
        secret: jwtRefreshSecret,
        expiresIn: jwtRefreshExpiration,
      } as never,
    );

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}

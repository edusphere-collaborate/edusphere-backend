import {
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserLoginDto } from './dto/user-login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JWTPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/shared/mail/mail.service';
import { TokenType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { subHours } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12; // bcrypt rounds
  private readonly VERIFICATION_EXPIRES = 24 * 60 * 60; // 24 hours
  private readonly RESET_EXPIRES = 60 * 60; // 1 hour
  tokenService: any;
  config: any;
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Central method to create token using standard payload
   */
  private async generateToken(user: {
    id: string;
    email: string;
    role: any;
  }): Promise<string> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.role === 'ADMIN',
    };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Registers a new user
   * Request Body: { username, firstName, lastName, email, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, token, message }
   */
  async register(registerDto: RegisterUserDto) {
    const { username, email, password, firstName, lastName } = registerDto;

    // Check for existing email
    const existingUserByEmail = await this.prismaService.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existingUserByEmail) {
      throw new ConflictException('Email already in use');
    }

    // Check for existing username
    const existingUserByUsername = await this.prismaService.user.findFirst({
      where: { username, deletedAt: null },
    });
    if (existingUserByUsername) {
      throw new ConflictException('Username already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prismaService.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'User', // Default role, adjust as needed
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = await this.generateToken(user);

    return {
      user,
      token,
      message: 'User registered successfully',
    };
  }

  /**
   * Logs in an existing user
   * Request Body: { identifier, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, token, message }
   */
  async login(loginDto: UserLoginDto) {
    console.log('Login attempt with:', loginDto.email);
    const user = await this.validateUser(loginDto);
    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }

    console.log('User logged in:', user.username);

    return {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token: user.token,
      message: 'Login successful',
    };
  }

  /**
   * Validates credentials and returns user + token
   */
  async validateUser(loginDto: UserLoginDto) {
    console.log('starting login');

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email: loginDto.email }, { username: loginDto.email }],
        deletedAt: null,
      },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);
    return { ...user, token };
  }

  /**
   * Retrieves the profile of a user
   * Response: { id, username, firstName, lastName, email, role, createdAt, updatedAt }
   */
  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  //  Send verification (first time)
  async sendVerification(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    if (user.emailVerified) {
      return { success: true, message: 'Email already verified', expiresIn: 0 };
    }

    // Rate-limiting should be enforced at controller layer (throttler)
    const { rawToken, expiresAt } = await this.tokenService.createToken(
      user.id,
      TokenType.EMAIL_VERIFICATION,
      this.VERIFICATION_EXPIRES,
    );

    const verificationLink = `${this.config.get('APP_BASE_URL')}/auth/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

    await this.mailService.sendMail(
      email,
      'Verify your EduSphere account',
      this.mailService.verificationEmailHtml(
        user.firstName ?? '',
        rawToken,
        verificationLink,
        24,
      ),
    );

    const expiresIn = Math.floor((expiresAt.getTime() - Date.now()) / 1000);

    return { success: true, message: 'Verification email sent', expiresIn };
  }

  // 2. Verify email token
  async verifyEmail(token: string, email?: string) {
    const tokenRecord = await this.tokenService.validateAndConsumeToken(
      token,
      TokenType.EMAIL_VERIFICATION,
    );
    if (!tokenRecord) {
      return { success: false, message: 'Invalid or expired token' };
    }

    // Optionally check email matches
    if (email && tokenRecord.user.email !== email) {
      throw new ForbiddenException('Token does not match email');
    }
    const user = await this.prismaService.user.update({
      where: { id: tokenRecord.userId },
      data: { emailVerified: true },
      select: { id: true, email: true, emailVerified: true },
    });

    return {
      success: true,
      message: 'Email verified',
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.emailVerified,
      },
    };
  }

  // 3. Resend verification (rate-limited at controller)
  async resendVerification(email: string) {
    // Behavior similar to sendVerification but allow cooldown logic at controller
    return this.sendVerification(email);
  }

  // 4. Forgot password request (generic response)
  async forgotPassword(email: string) {
    const user = await this.prismaService.user.findUnique({ where: { email } });

    // Always respond with generic success to avoid enumeration
    if (!user) {
      return {
        success: true,
        message: 'If that email exists, a reset link will be sent.',
      };
    }

    const { rawToken, expiresAt } = await this.tokenService.createToken(
      user.id,
      TokenType.PASSWORD_RESET,
      this.RESET_EXPIRES,
    );

    const resetLink = `${this.config.get('APP_BASE_URL')}/auth/reset-password?token=${rawToken}`;

    await this.mailService.sendMail(
      email,
      'Reset your EduSphere password',
      this.mailService.resetPasswordEmailHtml(
        user.firstName ?? '',
        rawToken,
        resetLink,
        1,
      ),
    );

    return {
      success: true,
      message: 'If that email exists, a reset link will be sent.',
      expiresIn: Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    };
  }

  // 5. Verify reset token
  async verifyResetToken(rawToken: string) {
    const tokenHash =
      /* reuse tokenService.hash logic indirectly by trying to find */ null;
    // We should look up by hashed token; reuse TokenService.validate but we don't want to consume token here
    // So implement a non-consuming validator:
    const hashed = (await import('./utils/token.util')).hashToken(rawToken);
    const token = await this.prismaService.token.findFirst({
      where: {
        tokenHash: hashed,
        type: TokenType.PASSWORD_RESET,
      },
      include: { user: true },
    });

    if (!token) {
      return { success: true, valid: false }; // generic
    }

    if (token.expiresAt < new Date()) {
      return { success: true, valid: false };
    }

    // mask email
    const email = token.user.email;
    const masked = maskEmail(email);

    return {
      success: true,
      valid: true,
      expiresAt: token.expiresAt.toISOString(),
      email: masked,
    };
  }

  // 6. Reset password using token
  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword)
      throw new BadRequestException('Passwords do not match');

    const tokenRecord = await this.tokenService.validateAndConsumeToken(
      token,
      TokenType.PASSWORD_RESET,
    );
    if (!tokenRecord) {
      return { success: false, message: 'Invalid or expired token' };
    }

    const user = tokenRecord.user;

    // Check password reuse (last 5)
    const lastPasswords = await this.prismaService.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const p of lastPasswords) {
      const match = await bcrypt.compare(newPassword, p.passwordHash);
      if (match) {
        throw new BadRequestException('Cannot reuse recent password');
      }
    }

    const hashed = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordChangedAt: new Date() },
    });

    // push to password history
    await this.prismaService.passwordHistory.create({
      data: {
        userId: user.id,
        passwordHash: hashed,
      },
    });

    // Trim history to keep only last 5 (optional)
    const histories = await this.prismaService.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (histories.length > 5) {
      const toDelete = histories.slice(5).map((h) => h.id);
      await this.prismaService.passwordHistory.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    // Optional: notify user
    const d = new Date();
    await this.mailService.sendMail(
      user.email,
      'Your EduSphere password was changed',
      this.mailService.passwordChangedNotificationHtml(
        user.firstName ?? '',
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
      ),
    );

    return {
      success: true,
      message: 'Password reset successfully',
      user: {
        id: user.id,
        email: user.email,
        passwordChangedAt: new Date().toISOString(),
      },
    };
  }

  // 7. Change password (authenticated)
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword)
      throw new BadRequestException('Passwords do not match');

    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) throw new ForbiddenException('Current password incorrect');

    // Check last 5
    const lastPasswords = await this.prismaService.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const p of lastPasswords) {
      const match = await bcrypt.compare(newPassword, p.passwordHash);
      if (match) {
        throw new BadRequestException('Cannot reuse recent password');
      }
    }

    const hashed = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

    await this.prismaService.user.update({
      where: { id: userId },
      data: { password: hashed, passwordChangedAt: new Date() },
    });

    await this.prismaService.passwordHistory.create({
      data: { userId: user.id, passwordHash: hashed },
    });

    // Keep history trimmed to 5 entries
    const histories = await this.prismaService.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    if (histories.length > 5) {
      const toDelete = histories.slice(5).map((h) => h.id);
      await this.prismaService.passwordHistory.deleteMany({
        where: { id: { in: toDelete } },
      });
    }

    const d = new Date();
    await this.mailService.sendMail(
      user.email,
      'Your EduSphere password was changed',
      this.mailService.passwordChangedNotificationHtml(
        user.firstName ?? '',
        d.toLocaleDateString(),
        d.toLocaleTimeString(),
      ),
    );

    return {
      success: true,
      message: 'Password changed',
      passwordChangedAt: new Date().toISOString(),
    };
  }

  async validateOAuthLogin(profile: any) {
    let user = await this.prismaService.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prismaService.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          profilePicture: profile.picture, // Changed from 'picture' to 'profilePicture' to match the Prisma schema
          isEmailVerified: true, // Google emails are already verified
          provider: 'GOOGLE',
          providerId: profile.providerId,
        },
      });
    }

    return user;
  }
}

/** small helper to mask email **/
function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  const maskedLocal =
    local.length <= 2
      ? local[0] + '*'
      : local.slice(0, 1) +
        '*'.repeat(Math.max(1, local.length - 2)) +
        local.slice(-1);
  return `${maskedLocal}@${domain}`;
}

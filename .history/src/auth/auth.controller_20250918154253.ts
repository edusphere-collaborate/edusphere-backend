import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { LocalGuard } from './guards/local.guard';
import { JWTAuthGuard } from './guards/jwt.guard';
import { AuthenticatedUser } from './interfaces/jwt-payload.interface';
import { Request } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { SendVerificationDto } from './dto/send-verification.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetTokenDto } from './dto/verify-reset-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';

interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /auth/register
   * Description: Register a new user.
   * Request Body: { username, firstName, lastName, email, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, token }
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Description: Authenticate a user and return a JWT.
   * Request Body: { email, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, token }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalGuard)
  async login(@Body() loginDto: UserLoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * GET /auth/profile
   * Description: Retrieve the authenticated user's profile.
   * Headers: Authorization: Bearer <token>
   * Response: { id, username, firstName, lastName, email, role, createdAt, updatedAt }
   */
  @Get('profile')
  @UseGuards(JWTAuthGuard)
  async getProfile(@Req() req: AuthenticatedRequest) {
    const user = req.user;

    if (!user || !user.id) {
      throw new NotFoundException('User not found');
    }

    return this.authService.getProfile(user.id);
  }

  /**
   * GET /auth/profile/:userId
   * Description: Retrieve a specific user's profile (restricted to admins or self).
   * Headers: Authorization: Bearer <token>
   * Response: { id, username, firstName, lastName, email, role, createdAt, updatedAt }
   */
  @Get('profile/:userId')
  @UseGuards(JWTAuthGuard)
  async getProfileById(
    @Req() req: AuthenticatedRequest,
    @Param('userId') userId: string,
  ) {
    const user = req.user;

    // Restrict access to admins or the user themselves
    if (!user || (!user.isAdmin && user.id !== userId)) {
      throw new NotFoundException('Unauthorized access to profile');
    }

    return this.authService.getProfile(userId);
  }

  // 1. Send verification - rate limited
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60 * 60 } }) // max 3 per hour per IP by default
  @Post('send-verification')
  async sendVerification(@Body() dto: SendVerificationDto) {
    return await this.authService.sendVerification(dto.email);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token, dto.email);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 60 * 60 } }) // 3 per hour
  @Post('resend-verification')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto.email);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 } }) // 5 per hour per IP
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('verify-reset-token')
  async verifyResetToken(@Body() dto: VerifyResetTokenDto) {
    return this.authService.verifyResetToken(dto.token);
  }

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60 * 60 } }) // protect reset usage endpoints as well
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.token,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  // change-password requires auth
  @UseGuards(JWTAuthGuard)
  @Post('change-password')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const userId = req.user?.id;
    return this.authService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // This route just initiates Google OAuth
    // The guard handles the redirect to Google
  }

  @Get('google/redirect')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: any) {
    try {
      // Process the authenticated Google user
      const tokenData = await this.authService.googleLogin(req.user);

      // Redirect to frontend with the token
      const frontendUrl = this.configService.get('APP_BASE_URL');
      const redirectUrl = `${frontendUrl}login/success?token=${tokenData.access_token}`;

      // Log the redirect URL for debugging
      console.log(`Redirecting to: ${redirectUrl}`);

      return res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google auth redirect error:', error);
      return res.redirect(
        `${this.configService.get('APP_BASE_URL')}/login/error?message=${encodeURIComponent('Authentication failed')}`,
      );
    }
  }

  // Step 1: Redirect user to GitHub
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    return { msg: 'Redirecting to GitHub...' };
  }

  // Step 2: GitHub redirects here after login
  @Get('github/redirect')
  @UseGuards(AuthGuard('github'))
  async githubLoginCallback(@Req() req, @Res() res: Response) {
        // req.user is coming from GitHubStrategy.validate()
    console.log('GitHub User:', req.user);

    // Save or fetch user from DB
    // const user = await this.authService.validateOAuthLogin(req.user);

    // Generate JWT
    const token = 'your-generated-jwt'; // replace with this.authService.generateJwt(req.user);

    // Redirect to frontend with token
    return res.redirect(
      `https://edusphere-learning-platform.vercel.app/login/success?token=${token}`,
    );

  }
}

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
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { LocalGuard } from './guards/local.guard';
import { JWTAuthGuard } from './guards/jwt.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  async getProfile(@Req() req: Request) {
    const user = req.user as any;

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
  async getProfileById(@Req() req: Request, @Param('userId') userId: string) {
    const user = req.user as any;

    // Restrict access to admins or the user themselves
    if (!user || (!user.isAdmin && user.id !== userId)) {
      throw new NotFoundException('Unauthorized access to profile');
    }

    return this.authService.getProfile(userId);
  }
}
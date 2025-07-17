import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Description: Register a new user.
   * Request Body: { username, firstName, lastName, email, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, message }
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  /**
   * POST /auth/login
   * Description: Authenticate a user.
   * Request Body: { email, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, message }
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: UserLoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * GET /auth/profile/:userId
   * Description: Retrieve user profile.
   * Response: { id, username, firstName, lastName, email, role, createdAt, updatedAt }
   */
  @Get('profile/:userId')
  async getProfile(@Param('userId') userId: string) {
    return this.authService.getProfile(userId);
  }
}

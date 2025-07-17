import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserLoginDto } from './dto/user-login.dto';
import { Request } from 'express';
import { UserRegisterDto } from './dto/create-user.dto';
import { LocalGuard } from './guards/local.guard';
import { JWTAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: UserRegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Body() dto: UserLoginDto) {
    return this.authService.login(dto);
  }

  @Get('profile')
  @UseGuards(JWTAuthGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as any;

    if (!user || !user.id) {
      throw new NotFoundException('User not found');
    }

    
    return this.authService.getProfile(user.id);
  }
}

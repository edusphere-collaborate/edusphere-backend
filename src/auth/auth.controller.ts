import { Body, Controller, Post } from '@nestjs/common';
import { UserLoginDto } from './dto/user-login.dto';

@Controller('auth')
export class AuthController {
  //   @Post('login')
  //   login(@Body() authPayload: UserLoginDto) {}
}

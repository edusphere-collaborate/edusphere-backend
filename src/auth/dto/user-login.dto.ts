import { IsNotEmpty, IsString } from 'class-validator';

export class UserLoginDto {
  @IsString()
  @IsNotEmpty()
  email: string; // Can be email or username

  @IsString()
  @IsNotEmpty()
  password: string;
}

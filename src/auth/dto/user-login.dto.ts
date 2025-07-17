import { IsNotEmpty, IsString } from 'class-validator';

export class UserLoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // Can be email or username

  @IsString()
  @IsNotEmpty()
  password: string;
}

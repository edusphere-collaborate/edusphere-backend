import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UserRegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string; // This can be either email or username

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}

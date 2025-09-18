import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  // Password rules: at least one uppercase, lowercase, number
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Password too weak',
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}

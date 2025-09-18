import { IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'Password too weak',
  })
  newPassword: string;

  @IsString()
  confirmPassword: string;
}

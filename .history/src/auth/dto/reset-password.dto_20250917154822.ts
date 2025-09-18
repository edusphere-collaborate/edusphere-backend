import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  // Password rules: at least one uppercase, lowercase, number
  @IsPassword()
  newPassword: string;

  @IsString()
  confirmPassword: string;
}
function IsPassword(): (target: ResetPasswordDto, propertyKey: "newPassword") => void {
    throw new Error('Function not implemented.');
}


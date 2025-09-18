import { IsEmail, Isn } from 'class-validator';

export class SendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

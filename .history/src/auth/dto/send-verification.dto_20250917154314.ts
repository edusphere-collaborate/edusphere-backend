import { IsEmail, isNotEmpty } from 'class-validator';

export class SendVerificationDto {
  @IsEmail()
  @isNotEmpty()
  email: string;
}

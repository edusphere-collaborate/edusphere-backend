import { IsString, IsOptional } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  email?: string;
}

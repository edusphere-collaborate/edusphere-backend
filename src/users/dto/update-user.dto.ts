import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Username must be a string' })
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @IsString({ message: 'First Name must be a string' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last Name must be a string' })
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(50, { message: 'Email must not exceed 50 characters' })
  email?: string;
}

import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username must not be empty' })
  @MaxLength(30)
  username: string;

  @IsOptional()
  @IsString({ message: 'First Name must be a string' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last Name must be a string' })
  lastName?: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(50, { message: 'Email must not exceed 50 characters' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

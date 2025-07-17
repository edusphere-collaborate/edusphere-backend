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

  @IsString({ message: 'First Name must be a string' })
  @IsOptional()
  firstName?: string;

  @IsString({ message: 'Last Name must be a string' })
  @IsOptional()
  lastName?: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  @MaxLength(50, { message: 'Email must not exceed 50 characters' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class RegisterUserDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username must not be empty' })
  @MaxLength(30)
  username: string;

  @IsString({ message: 'First Name must be a string' })
  @IsNotEmpty({ message: 'First Name must not be empty' })
  firstName: string;

  @IsString({ message: 'Last Name must be a string' })
  @IsNotEmpty({ message: 'Last Name must not be empty' })
  lastName: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MaxLength(50, { message: 'Email must not exceed 50 characters' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;
}

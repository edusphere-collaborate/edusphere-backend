import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';

import { UserRole } from 'generated/prisma';

export class CreateUserDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  username: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(3, { message: 'First name must be at least 3 characters' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(3, { message: 'Last name must be at least 3 characters' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(100, { message: 'Email must not exceed 100 characters' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(64, { message: 'Password must not exceed 64 characters' })
  password: string;
  @IsIn(Object.values(UserRole), {
    message: 'Role must be either USER, ADMIN, or INSTRUCTOR',
  })
  role: UserRole; // Assuming role is a string, adjust as necessary
}

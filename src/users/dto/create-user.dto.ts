import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
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

  @IsEmail()
  @MaxLength(50)
  email: string;

  @IsString({ message: 'password must be string' })
  @MinLength(6)
  password: string;
}

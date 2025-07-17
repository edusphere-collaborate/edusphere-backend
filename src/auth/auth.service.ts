import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserLoginDto } from './dto/user-login.dto';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { comparePassword, hashPassword } from 'src/utils/bcrypt';

// Define the JwtPayload interface
interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Central method to create token using standard payload
   */
  private async generateToken(user: { id: string; email: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Registers a new user
   */
  async register(dto: CreateUserDto) {
    const { username, email, password, firstName, lastName } = dto;

    const existingUserByEmail = await this.prismaService.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (existingUserByEmail) {
      throw new ConflictException('Email already in use');
    }

    const existingUserByUsername = await this.prismaService.user.findFirst({
      where: {
        username,
        deletedAt: null,
      },
    });

    if (existingUserByUsername) {
      throw new ConflictException('Username already in use');
    }

    const hashedPassword = await hashPassword(password);

    const user = await this.prismaService.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
      },
    });

    const token = await this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  /**
   * Logs in an existing user
   */
  async login(dto: UserLoginDto) {
    const user = await this.validateUser(dto);

    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }

    return user;
  }

  /**
   * Validates credentials and returns user + token
   */
  async validateUser(validateUserDto: UserLoginDto) {
    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [
          { email: validateUserDto.identifier },
          { username: validateUserDto.identifier },
        ],
      },
    });

    if (
      !user ||
      !(await comparePassword(validateUserDto.password, user.password))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    };
  }

  /**
   * Retrieves the profile of the authenticated user
   */
  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new UnauthorizedException('User not found');

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.createdAt, // matches the expected response format
    };
  }
}

import {
  ConflictException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UserLoginDto } from './dto/user-login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { JWTPayload } from './interfaces/jwt-payload.interface';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/shared/mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService
  ) {}

  /**
   * Central method to create token using standard payload
   */
  private async generateToken(user: {
    id: string;
    email: string;
    role: any;
  }): Promise<string> {
    const payload: JWTPayload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.role === 'ADMIN',
    };
    return this.jwtService.signAsync(payload);
  }

  /**
   * Registers a new user
   * Request Body: { username, firstName, lastName, email, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, token, message }
   */
  async register(registerDto: RegisterUserDto) {
    const { username, email, password, firstName, lastName } = registerDto;

    // Check for existing email
    const existingUserByEmail = await this.prismaService.user.findFirst({
      where: { email, deletedAt: null },
    });
    if (existingUserByEmail) {
      throw new ConflictException('Email already in use');
    }

    // Check for existing username
    const existingUserByUsername = await this.prismaService.user.findFirst({
      where: { username, deletedAt: null },
    });
    if (existingUserByUsername) {
      throw new ConflictException('Username already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prismaService.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'User', // Default role, adjust as needed
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = await this.generateToken(user);

    return {
      user,
      token,
      message: 'User registered successfully',
    };
  }

  /**
   * Logs in an existing user
   * Request Body: { identifier, password }
   * Response: { user: { id, username, firstName, lastName, email, role }, token, message }
   */
  async login(loginDto: UserLoginDto) {
    console.log('Login attempt with:', loginDto.email);
    const user = await this.validateUser(loginDto);
    if (!user) {
      throw new HttpException('Invalid credentials', 401);
    }

    console.log('User logged in:', user.username);

    return {
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token: user.token,
      message: 'Login successful',
    };
  }

  /**
   * Validates credentials and returns user + token
   */
  async validateUser(loginDto: UserLoginDto) {
    console.log('starting login');

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ email: loginDto.email }, { username: loginDto.email }],
        deletedAt: null,
      },
    });

    if (!user || !(await bcrypt.compare(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.generateToken(user);
    return { ...user, token };
  }

  /**
   * Retrieves the profile of a user
   * Response: { id, username, firstName, lastName, email, role, createdAt, updatedAt }
   */
  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}

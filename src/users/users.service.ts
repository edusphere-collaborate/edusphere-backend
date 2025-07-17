import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Create a new user (admin-initiated)
   * @param createUserDto - DTO with username, firstName, lastName, email, password
   * @returns Created user data
   */
  async create(createUserDto: RegisterUserDto) {
    const { username, email, password, firstName, lastName } = createUserDto;

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
    return await this.prismaService.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        firstName: firstName || '',
        lastName: lastName || '',
        role: 'USER', // Default role, adjust as needed
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
  }

  /**
   * Find all users with pagination (admin only)
   * @param skip - Number of records to skip
   * @param take - Number of records to take
   * @returns Array of user data
   */
  async findAll(skip: number = 0, take: number = 50) {
    // Validate and sanitize pagination parameters
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100); // Max 100 per page

    return await this.prismaService.user.findMany({
      where: { deletedAt: null }, // Exclude soft-deleted users
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' }, // Most recent first
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
  }

  /**
   * Find one user by ID with related data
   * @param id - User ID
   * @returns User data with rooms, createdRooms, and stats
   */
  async findOne(id: string) {
    // Validate ID format (basic UUID check)
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new NotFoundException('Invalid user ID provided');
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: id.trim(), deletedAt: null },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        rooms: {
          where: { deletedAt: null },
          select: { id: true, name: true, slug: true },
        },
        createdRooms: {
          where: { deletedAt: null },
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: {
            messages: true,
            aiQueries: true,
            media: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Update user by ID
   * @param id - User ID
   * @param updateUserDto - DTO with fields to update
   * @returns Updated user data
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Validate existence
    await this.findOne(id);

    return await this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Soft-delete user by ID
   * @param id - User ID
   * @returns Updated user data with deletedAt set
   */
  async remove(id: string) {
    // Validate existence
    await this.findOne(id);

    return await this.prismaService.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: {
        id: true,
        username: true,
        email: true,
        deletedAt: true,
      },
    });
  }
}
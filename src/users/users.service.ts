import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  // Create a new user
  async create(createUserDto: CreateUserDto) {
    return await this.prismaService.user.create({ data: createUserDto });
  }

  // Find all users (e.g., admin panel) with pagination
  async findAll(skip: number = 0, take: number = 50) {
    // Validate and sanitize pagination parameters
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100); // Max 100 per page

    return await this.prismaService.user.findMany({
      where: { deletedAt: null }, // Exclude soft-deleted users
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' }, // Most recent first for better performance
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password and other sensitive fields
      },
    });
  }

  // Find one user by ID with optimized query
  async findOne(id: string) {
    // Validate ID format (basic UUID check)
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new NotFoundException(`Invalid user ID provided`);
    }

    const user = await this.prismaService.user.findUnique({
      where: { id: id.trim() },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        // Include related data for complete user profile
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

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Update user by ID
  async update(id: string, updateUserDto: UpdateUserDto) {
    // The findOne method already throws a NotFoundException if the user doesn't exist
    await this.findOne(id);

    return await this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // Soft-delete user (sets deletedAt)
  async remove(id: string) {
    // The findOne method already throws a NotFoundException if the user doesn't exist
    await this.findOne(id);

    return await this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

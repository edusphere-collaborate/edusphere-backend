import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  // Create a new user
  async create(createUserDto: CreateUserDto) {
    return await this.prismaService.user.create({ data: createUserDto });
  }

  // Find all users (e.g., admin panel)
  async findAll() {
    return await this.prismaService.user.findMany({
      where: { deletedAt: null }, // Exclude soft-deleted users
    });
  }

  // Find one user by ID
  async findOne(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  // Update user by ID
  async update(id: string, updateUserDto: UpdateUserDto) {
    // Ensure user exists before updating
    const existingUser = await this.findOne(id);

    if (!existingUser) {
      // This line will never be reached if findOne throws an error when user doesn't exist
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return await this.prismaService.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // Soft-delete user (sets deletedAt)
  async remove(id: string) {
    const existingUser = await this.findOne(id);

    if (!existingUser) {
      // This line will never be reached if findOne throws an error when user doesn't exist
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return await this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

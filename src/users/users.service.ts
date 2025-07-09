import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private async finExistingUserOrThrow(id: string) {
    // Check if the user exists
    const findExistingUser = await this.prisma.user.findUnique({
      where: { id: id },
    });

    // If the user does not exist, throw a NotFoundException
    if (!findExistingUser) {
      throw new NotFoundException('User not found');
    }

    return findExistingUser;
  }

  async create(createUserDto: CreateUserDto) {
    // Check if a user with the same email or username already exists

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email },
          { username: createUserDto.username },
        ],
      },
    });

    // If a user with the same email or username exists, throw a ConflictException
    // This will prevent duplicate users from being created
    if (existingUser) {
      throw new ConflictException(
        'User with this email or username already exists',
      );
    }

    // If no existing user is found, proceed to create the new user
    return await this.prisma.user.create({
      data: createUserDto,
    });
  }

  async findAll() {
    return await this.prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        password: true, // Include password if needed, otherwise remove it
      },
    });
  }

  async findOne(id: string) {
    return await this.finExistingUserOrThrow(id);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.finExistingUserOrThrow(id);

    // If the user exists, proceed to update the user
    return await this.prisma.user.update({
      where: { id: id },
      data: updateUserDto,
    });
  }

  async remove(id: string) {
    // return await this.prisma.user.delete({
    //   where: { id: id },
    // });

    // Check if the user exists
    // Instead of deleting, we will soft delete the user by setting deletedAt

    await this.finExistingUserOrThrow(id);

    return await this.prisma.user.update({
      where: { id: id },
      data: { deletedAt: new Date() }, // Soft delete
    });
  }
}

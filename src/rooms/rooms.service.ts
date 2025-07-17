import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new room
  async create(createRoomDto: CreateRoomDto) {
    return await this.prisma.room.create({
      data: createRoomDto,
    });
  }

  // Get all rooms (excluding soft-deleted ones) with pagination and optimization
  async findAll(skip: number = 0, take: number = 50) {
    // Validate and sanitize pagination parameters
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100); // Max 100 per page

    return await this.prisma.room.findMany({
      where: {
        deletedAt: null, // Filter out deleted rooms
      },
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { updatedAt: 'desc' }, // Most recently updated first
      select: {
        id: true,
        name: true,
        description: true,
        slug: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            users: true,
            messages: true,
            media: true,
          },
        },
      },
    });
  }

  // Get a single room by ID with optimized query
  async findOne(id: string) {
    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new NotFoundException(`Invalid room ID provided`);
    }

    const room = await this.prisma.room.findUnique({
      where: { id: id.trim() },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 50, // Limit recent messages for performance
          select: {
            id: true,
            content: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            messages: true,
            media: true,
          },
        },
      },
    });

    if (!room || room.deletedAt) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  // Update a room by ID
  async update(id: string, updateRoomDto: UpdateRoomDto) {
    // Ensure room exists first
    await this.findOne(id);

    return await this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }

  // Soft delete a room (sets deletedAt)
  async remove(id: string) {
    // Ensure room exists first
    await this.findOne(id);

    return await this.prisma.room.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

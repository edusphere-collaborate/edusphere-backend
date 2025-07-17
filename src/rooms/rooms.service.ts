import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';

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

  // Create a message in a room
  async createMessage(createMessageDto: CreateMessageDto) {
    // Verify room exists
    await this.findOne(createMessageDto.roomId);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createMessageDto.userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prisma.message.create({
      data: {
        content: createMessageDto.content,
        userId: createMessageDto.userId,
        roomId: createMessageDto.roomId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Get messages for a room with pagination
  async getRoomMessages(roomId: string, skip: number = 0, take: number = 50) {
    // Verify room exists
    await this.findOne(roomId);

    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    return await this.prisma.message.findMany({
      where: {
        roomId,
        deletedAt: null,
      },
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Add user to room
  async addUserToRoom(roomId: string, userId: string) {
    // Verify room exists
    await this.findOne(roomId);

    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Add user to room (using the many-to-many relation)
    return await this.prisma.room.update({
      where: { id: roomId },
      data: {
        users: {
          connect: { id: userId },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }
}

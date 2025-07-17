import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMediaDto, MediaType } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MediaService {
  constructor(private readonly prismaService: PrismaService) {}

  // Create a new media entry
  async create(createMediaDto: CreateMediaDto) {
    // Verify room exists
    const room = await this.prismaService.room.findUnique({
      where: { id: createMediaDto.roomId, deletedAt: null },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    // Verify user exists
    const user = await this.prismaService.user.findUnique({
      where: { id: createMediaDto.userId, deletedAt: null },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return await this.prismaService.media.create({
      data: createMediaDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // Find all media with pagination
  async findAll(skip: number = 0, take: number = 50) {
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    return await this.prismaService.media.findMany({
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
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // Find media by room ID
  async findByRoomId(roomId: string, skip: number = 0, take: number = 50) {
    // Verify room exists
    const room = await this.prismaService.room.findUnique({
      where: { id: roomId, deletedAt: null },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    return await this.prismaService.media.findMany({
      where: { roomId },
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

  // Find media by user ID
  async findByUserId(userId: string, skip: number = 0, take: number = 50) {
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    return await this.prismaService.media.findMany({
      where: { userId },
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // Find one media item by ID
  async findOne(id: string) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new NotFoundException(`Invalid media ID provided`);
    }

    const media = await this.prismaService.media.findUnique({
      where: { id: id.trim() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }

    return media;
  }

  // Update media (limited fields)
  async update(id: string, updateMediaDto: UpdateMediaDto) {
    await this.findOne(id); // Verify exists

    return await this.prismaService.media.update({
      where: { id },
      data: updateMediaDto,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  // Delete media
  async remove(id: string) {
    await this.findOne(id); // Verify exists

    return await this.prismaService.media.delete({
      where: { id },
    });
  }

  // Helper method to create a simple media upload endpoint
  async createSimpleUpload(
    userId: string,
    roomId: string,
    fileUrl: string,
    fileType: string,
  ) {
    const mediaType = fileType.startsWith('image/')
      ? MediaType.IMAGE
      : MediaType.VIDEO;

    const createMediaDto: CreateMediaDto = {
      url: fileUrl,
      type: mediaType,
      userId,
      roomId,
    };

    return this.create(createMediaDto);
  }
}

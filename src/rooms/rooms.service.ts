import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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

  // Get all rooms (excluding soft-deleted ones)
  async findAll() {
    return await this.prisma.room.findMany({
      where: {
        deletedAt: null, // Filter out deleted rooms
      },
    });
  }

  // Get a single room by ID
  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });

    if (!room || room.deletedAt) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  // Update a room by ID
  async update(id: string, updateRoomDto: UpdateRoomDto) {
    // Ensure room exists first
    const existingRoom = await this.findOne(id);

    if (!existingRoom) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return await this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
  }

  // Soft delete a room (sets deletedAt)
  async remove(id: string) {
    const existingRoom = await this.findOne(id);

    if (!existingRoom) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return await this.prisma.room.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

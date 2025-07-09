import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findExistingRoomOrThrow(id: string) {
    const existingRoom = await this.prisma.room.findUnique({
      where: { id: id },
    });

    if (!existingRoom) {
      throw new NotFoundException('Room not found');
    }

    return existingRoom;
  }

  async create(createRoomDto: CreateRoomDto) {
    const checkExistingSlug = await this.prisma.room.findUnique({
      where: { slug: createRoomDto.slug },
    });

    if (checkExistingSlug) {
      throw new ConflictException(' Use a Unique Slug');
    }

    return await this.prisma.room.create({ data: createRoomDto });
  }

  async findAll() {
    return await this.prisma.room.findMany();
  }

  async findOne(id: string) {
    await this.findExistingRoomOrThrow(id);

    return await this.prisma.room.findFirst({ where: { id: id } });
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    await this.findExistingRoomOrThrow(id);
    return this.prisma.room.update({ where: { id: id }, data: updateRoomDto });
  }

  async remove(id: string) {
    return await this.prisma.room.update({
      where: { id: id },
      data: { deletedAt: new Date() },
    });
  }
}

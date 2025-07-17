import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * POST /rooms
   * Description: Create a new discussion room.
   * Request Body: { name, slug?, description?, creatorId }
   * Response: { id, name, creatorId, createdAt }
   */
  @Post()
  async create(@Body() createRoomDto: CreateRoomDto) {
    const room = await this.roomsService.create(createRoomDto);

    return {
      id: room.id,
      name: room.name,
      slug: room.slug,
      creatorId: room.creatorId,
      createdAt: room.createdAt,
    };
  }

  /**
   * GET /rooms
   * Description: List all discussion rooms.
   * Response: [{ id, name, creatorId, createdAt }, ...]
   */
  @Get()
  async findAll() {
    const rooms = await this.roomsService.findAll();

    // Return minimal public info
    return rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      slug: room.slug,
      creator: room.creator,
      userCount: room._count.users,
      messageCount: room._count.messages,
      mediaCount: room._count.media,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    }));
  }

  /**
   * GET /rooms/:id
   * Description: Retrieve details of a specific room.
   * Response: {
   *   id,
   *   name,
   *   creatorId,
   *   messages: [
   *     { id, content, userId, sentAt (createdAt) }, ...
   *   ]
   * }
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const room = await this.roomsService.findOne(id);

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    // Map messages from the optimized query result
    const messages =
      room.messages?.map((msg) => ({
        id: msg.id,
        content: msg.content,
        userId: msg.user.id,
        username: msg.user.username,
        sentAt: msg.createdAt,
      })) || [];

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      slug: room.slug,
      creator: room.creator,
      users: room.users,
      messages,
      stats: room._count,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
  }

  /**
   * PATCH /rooms/:id
   * Description: Update room info (e.g., name/description)
   * Request Body: { name?, description? }
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    const room = await this.roomsService.update(id, updateRoomDto);

    return {
      id: room.id,
      name: room.name,
      description: room.description,
      updatedAt: room.updatedAt,
    };
  }

  /**
   * DELETE /rooms/:id
   * Description: Soft-delete a room
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const room = await this.roomsService.remove(id);

    return {
      message: `Room with ID ${room.id} was successfully soft-deleted.`,
    };
  }
}

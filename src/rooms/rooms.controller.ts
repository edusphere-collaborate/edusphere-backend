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
      creatorId: room.creatorId,
      createdAt: room.createdAt,
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

    // If the room has no messages property or it's not an array, return empty array
    const messages = Array.isArray(room['messages'])
      ? room['messages'].map((msg: any) => ({
          id: msg.id as string,
          content: msg.content as string,
          userId: msg.userId as string,
          sentAt: msg.createdAt as Date,
        }))
      : [];

    return {
      id: room.id,
      name: room.name,
      creatorId: room.creatorId,
      messages,
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

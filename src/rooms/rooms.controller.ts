import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { CreateMessageDto } from './dto/create-message.dto';

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
   * POST /rooms/:id/messages
   * Description: Send a message in a room.
   * Request Body: { content, userId }
   * Response: { id, roomId, userId, content, sentAt }
   */
  @Post(':id/messages')
  async createMessage(
    @Param('id') roomId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    const messageData = {
      ...createMessageDto,
      roomId,
    };

    const message = await this.roomsService.createMessage(messageData);

    return {
      id: message.id,
      roomId: message.roomId,
      userId: message.userId,
      content: message.content,
      user: message.user,
      sentAt: message.createdAt,
    };
  }

  /**
   * GET /rooms/:id/messages
   * Description: Get messages for a specific room with pagination.
   * Query Parameters: skip?, take?
   * Response: [{ id, content, userId, user, sentAt }, ...]
   */
  @Get(':id/messages')
  async getRoomMessages(
    @Param('id') roomId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    const messages = await this.roomsService.getRoomMessages(
      roomId,
      skipNumber,
      takeNumber,
    );

    return messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      userId: msg.userId,
      user: msg.user,
      sentAt: msg.createdAt,
    }));
  }

  /**
   * POST /rooms/:id/join
   * Description: Add a user to a room.
   * Request Body: { userId }
   * Response: { message, room }
   */
  @Post(':id/join')
  async joinRoom(
    @Param('id') roomId: string,
    @Body() body: { userId: string },
  ) {
    const room = await this.roomsService.addUserToRoom(roomId, body.userId);

    return {
      message: 'User successfully joined the room',
      room: {
        id: room.id,
        name: room.name,
        users: room.users,
      },
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

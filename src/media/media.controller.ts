import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';

@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * POST /media
   * Description: Upload a new media file to a room.
   * Request Body: { url, type, userId, roomId }
   * Response: { id, url, type, userId, roomId, user, room, createdAt }
   */
  @Post()
  async create(@Body() createMediaDto: CreateMediaDto) {
    const media = await this.mediaService.create(createMediaDto);

    return {
      id: media.id,
      url: media.url,
      type: media.type,
      userId: media.userId,
      roomId: media.roomId,
      user: media.user,
      room: media.room,
      createdAt: media.createdAt,
    };
  }

  /**
   * GET /media
   * Description: Get all media with pagination.
   * Query Parameters: skip?, take?
   * Response: [{ id, url, type, user, room, createdAt }, ...]
   */
  @Get()
  async findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    return await this.mediaService.findAll(skipNumber, takeNumber);
  }

  /**
   * GET /media/room/:roomId
   * Description: Get media files for a specific room.
   * Query Parameters: skip?, take?
   * Response: [{ id, url, type, user, createdAt }, ...]
   */
  @Get('room/:roomId')
  async findByRoomId(
    @Param('roomId') roomId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    return await this.mediaService.findByRoomId(roomId, skipNumber, takeNumber);
  }

  /**
   * GET /media/user/:userId
   * Description: Get media files uploaded by a specific user.
   * Query Parameters: skip?, take?
   * Response: [{ id, url, type, room, createdAt }, ...]
   */
  @Get('user/:userId')
  async findByUserId(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    return await this.mediaService.findByUserId(userId, skipNumber, takeNumber);
  }

  /**
   * GET /media/:id
   * Description: Get a specific media file by ID.
   * Response: { id, url, type, user, room, createdAt }
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.mediaService.findOne(id);
  }

  /**
   * POST /media/upload
   * Description: Simple media upload endpoint.
   * Request Body: { userId, roomId, fileUrl, fileType }
   * Response: { id, url, type, user, room, createdAt }
   */
  @Post('upload')
  async simpleUpload(
    @Body()
    uploadData: {
      userId: string;
      roomId: string;
      fileUrl: string;
      fileType: string;
    },
  ) {
    return await this.mediaService.createSimpleUpload(
      uploadData.userId,
      uploadData.roomId,
      uploadData.fileUrl,
      uploadData.fileType,
    );
  }

  /**
   * PATCH /media/:id
   * Description: Update media information.
   * Request Body: { url?, type? }
   * Response: { id, url, type, user, room, updatedAt }
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
  ) {
    return await this.mediaService.update(id, updateMediaDto);
  }

  /**
   * DELETE /media/:id
   * Description: Delete a media file.
   * Response: { message }
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.mediaService.remove(id);
    return { message: `Media with ID ${id} was successfully deleted.` };
  }
}

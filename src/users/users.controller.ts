import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * Description: Create a new user (e.g., for registration)
   * Request Body: { username, firstName, lastName, email, password }
   * Response: { id, username, firstName, lastName, email, createdAt }
   */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Only return safe fields
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  /**
   * GET /users
   * Description: Get all users with pagination
   * Query Parameters: skip?, take?
   * Response: [{ id, username, firstName, lastName, email, role, createdAt }, ...]
   */
  @Get()
  async findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    const users = await this.usersService.findAll(skipNumber, takeNumber);
    // Return only public profiles
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));
  }

  /**
   * GET /users/:id
   * Description: Get detailed profile of a user
   * Response: { id, username, firstName, lastName, email, role, rooms, createdRooms, stats, createdAt }
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      rooms: user.rooms,
      createdRooms: user.createdRooms,
      stats: user._count,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * GET /users/:id/public
   * Description: Get public profile of a user (limited information)
   * Response: { id, username, firstName, lastName, createdAt }
   */
  @Get(':id/public')
  async getPublicProfile(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    };
  }

  /**
   * PATCH /users/:id
   * Description: Update user profile
   * Request Body: { username?, firstName?, lastName?, email? }
   * Response: { id, username, firstName, lastName, email, updatedAt }
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * DELETE /users/:id
   * Description: Soft delete a user
   * Response: { message }
   */
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: `User with ID ${id} was successfully soft-deleted.` };
  }
}

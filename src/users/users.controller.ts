import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JWTAuthGuard } from '../auth/guards/jwt.guard';
import { Request } from 'express';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * POST /users
   * Description: Create a new user (admin only)
   * Headers: Authorization: Bearer <token>
   * Request Body: { username, firstName, lastName, email, password }
   * Response: { id, username, firstName, lastName, email, role, createdAt }
   */
  @Post()
  @UseGuards(JWTAuthGuard)
  async create(@Req() req: Request, @Body() createUserDto: RegisterUserDto) {
    const user = req.user as any;
    if (!user || !user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    const newUser = await this.usersService.create(createUserDto);
    return {
      id: newUser.id,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * GET /users
   * Description: Get all users with pagination (admin only)
   * Headers: Authorization: Bearer <token>
   * Query Parameters: skip?, take?
   * Response: [{ id, username, firstName, lastName, email, role, createdAt }, ...]
   */
  @Get()
  @UseGuards(JWTAuthGuard)
  async findAll(
    @Req() req: Request,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const user = req.user as any;
    if (!user || !user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    const users = await this.usersService.findAll(skipNumber, takeNumber);
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
   * Description: Get detailed profile of a user (authenticated user or admin)
   * Headers: Authorization: Bearer <token>
   * Response: { id, username, firstName, lastName, email, role, rooms, createdRooms, stats, createdAt, updatedAt }
   */
  @Get(':id')
  @UseGuards(JWTAuthGuard)
  async findOne(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    if (!user || (!user.isAdmin && user.id !== id)) {
      throw new UnauthorizedException('Unauthorized access to profile');
    }

    const profile = await this.usersService.findOne(id);
    return {
      id: profile.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      role: profile.role,
      rooms: profile.rooms,
      createdRooms: profile.createdRooms,
      stats: profile._count,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  /**
   * GET /users/:id/public
   * Description: Get public profile of a user (limited information, public access)
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
   * Description: Update user profile (authenticated user or admin)
   * Headers: Authorization: Bearer <token>
   * Request Body: { username?, firstName?, lastName?, email? }
   * Response: { id, username, firstName, lastName, email, role, updatedAt }
   */
  @Patch(':id')
  @UseGuards(JWTAuthGuard)
  async update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = req.user as any;
    if (!user || (!user.isAdmin && user.id !== id)) {
      throw new UnauthorizedException('Unauthorized access to profile');
    }

    const updatedUser = await this.usersService.update(id, updateUserDto);
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      updatedAt: updatedUser.updatedAt,
    };
  }

  /**
   * DELETE /users/:id
   * Description: Soft delete a user (admin only)
   * Headers: Authorization: Bearer <token>
   * Response: { message }
   */
  @Delete(':id')
  @UseGuards(JWTAuthGuard)
  async remove(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as any;
    if (!user || !user.isAdmin) {
      throw new UnauthorizedException('Admin access required');
    }

    await this.usersService.remove(id);
    return { message: `User with ID ${id} was successfully soft-deleted` };
  }
}
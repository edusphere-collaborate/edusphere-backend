import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /users → Create a new user (e.g., for registration)
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Only return safe fields
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  // GET /users → Get all users (for admin or debug purposes)
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    // Return only public profiles
    return users.map((user) => ({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    }));
  }

  // GET /users/:id → Get public profile of a user
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt,
    };
  }

  // PUT /users/:id → Update user profile (email, username)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };
  }
}

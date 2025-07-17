import { Controller, Get, Body, Param, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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

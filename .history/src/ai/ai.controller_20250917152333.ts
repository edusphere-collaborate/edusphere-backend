// 3. ai/ai.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AiService } from './ai.service';

import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('queries/:id')
  async findOne(@Param('id') id: string) {
    return await this.aiService.findOne(id);
  }

  /**
   * GET /ai/users/:userId/queries
   * Get AI queries for a specific user
   * Query Parameters: skip?, take?
   * Returns: [{ id, query, response, createdAt }, ...]
   */
  @Get('users/:userId/queries')
  async findByUserId(
    @Param('userId') userId: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    return await this.aiService.findByUserId(userId, skipNumber, takeNumber);
  }
  @UseGuards(AuthGuard('jwt'))
  @Post('aiquery')
  async aiquery(
    @Body('query') query: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    const user_id = req.user.id;
    const response = await this.aiService.handleQuery(query, user_id);
    return {
      id: Date.now().toString(),
      user_id,
      query,
      response,
      created_at: new Date().toISOString(),
    };
  }
}

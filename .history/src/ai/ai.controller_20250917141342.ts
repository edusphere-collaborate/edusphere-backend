// 3. ai/ai.controller.ts
import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateAiQueryDto } from './dto/create-ai.dto';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/query
   * Submit academic query to AI assistant
   * Body: { userId, query }
   * Returns: { id, userId, query, response, createdAt, user }
   */
  @Post('query')
  async create(@Body() createAiQueryDto: CreateAiQueryDto) {
    const query = await this.aiService.create(createAiQueryDto);

    return {
      id: query.id,
      userId: query.userId,
      query: query.query,
      response: query.response,
      createdAt: query.createdAt,
      user: query.user,
    };
  }

  /**
   * GET /ai/queries
   * Get all AI queries with pagination
   * Query Parameters: skip?, take?
   * Returns: [{ id, query, response, createdAt, user }, ...]
   */
  @Get('queries')
  async findAll(@Query('skip') skip?: string, @Query('take') take?: string) {
    const skipNumber = skip ? parseInt(skip, 10) : 0;
    const takeNumber = take ? parseInt(take, 10) : 50;

    return await this.aiService.findAll(skipNumber, takeNumber);
  }

  /**
   * GET /ai/queries/:id
   * Get a specific AI query by ID
   * Returns: { id, query, response, createdAt, user }
   */
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

  @UseGuards(AuthGuard)
  @Post('query')
  async query(@Body('query') query: string, @Req() req) {
    const user_id = req.user.id;
    const response = await this.aiService.chat(query);
    return {
      id: Date.now().toString(),
      user_id,
      query,
      response,
      created_at: new Date().toISOString(),
    };
  }
}

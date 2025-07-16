// 3. ai/ai.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { CreateAiQueryDto } from './dto/create-ai.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * POST /ai/query
   * Submit academic query to AI assistant
   * Body: { userId, query }
   * Returns: { id, userId, query, response, createdAt }
   */
  @Post('query')
  create(@Body() createAiQueryDto: CreateAiQueryDto) {
    const query = this.aiService.create(createAiQueryDto);

    return {
      query,
    };
  }
}

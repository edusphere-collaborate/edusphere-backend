import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAiQueryDto } from './dto/create-ai.dto';

import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
@Injectable()
export class AiService {
  private readonly genAI: GoogleGenAI;
  constructor(private readonly prismaService: PrismaService) {
    this.genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });
  }

  async handleQuery(query: string, userId: string) {
    const model = await this.genAI.models.get({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent({ prompt: query });
  }
}

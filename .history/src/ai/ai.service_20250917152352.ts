import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { GoogleGenAI } from '@google/genai';
@Injectable()
export class AiService {
  private readonly genAI: GoogleGenAI;
  constructor(private readonly prismaService: PrismaService) {
    this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // Create an AI query with validation and optimization

  // Find one AI query by ID with optimization
  async findOne(id: string) {
    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new NotFoundException(`Invalid AI query ID provided`);
    }

    const query = await this.prismaService.aIQuery.findUnique({
      where: { id: id.trim() },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!query || query.deletedAt) {
      throw new NotFoundException(`AI query with ID ${id} not found`);
    }

    return query;
  }

  // Find AI queries by user ID
  async findByUserId(userId: string, skip: number = 0, take: number = 50) {
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100);

    return await this.prismaService.aIQuery.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        query: true,
        response: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prismaService.aIQuery.findFirst({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    return await this.prismaService.aIQuery.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async handleQuery(query: string, userId: string) {
    // Call Gemini model
    const response = await this.genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: query }] }],
    });

    const answer = response.text ?? 'No response from AI';

    // Store the query and response in the database
    const savedResponse = await this.prismaService.aIQuery.create({
      data: {
        userId,
        query,
        response: answer,
      },
    });
    return {
      id: savedResponse.id,
      user_id: savedResponse.userId,
      query: savedResponse.query,
      response: savedResponse.response,
      created_at: savedResponse.createdAt,
    };
  }
}

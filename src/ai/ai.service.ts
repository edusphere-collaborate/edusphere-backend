import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAiQueryDto } from './dto/create-ai.dto';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prismaService: PrismaService) {}
  // Create an AI query with validation and optimization
  async create(createAiDto: CreateAiQueryDto) {
    // Validate input
    if (!createAiDto.userId || !createAiDto.query) {
      throw new Error('UserId and query are required');
    }

    // Sanitize and validate query length
    const sanitizedQuery = createAiDto.query.trim();
    if (sanitizedQuery.length === 0) {
      throw new Error('Query cannot be empty');
    }
    if (sanitizedQuery.length > 10000) {
      throw new Error('Query exceeds maximum length of 10,000 characters');
    }

    return await this.prismaService.aIQuery.create({
      data: {
        userId: createAiDto.userId,
        query: sanitizedQuery,
      },
    });
  }

  // Find all AI queries with pagination and optimization
  async findAll(skip: number = 0, take: number = 50) {
    // Validate and sanitize pagination parameters
    const validatedSkip = Math.max(0, skip);
    const validatedTake = Math.min(Math.max(1, take), 100); // Max 100 per page

    return await this.prismaService.aIQuery.findMany({
      where: { deletedAt: null },
      skip: validatedSkip,
      take: validatedTake,
      orderBy: { createdAt: 'desc' }, // Most recent first
      select: {
        id: true,
        query: true,
        response: true,
        createdAt: true,
        updatedAt: true,
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
  }
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
}

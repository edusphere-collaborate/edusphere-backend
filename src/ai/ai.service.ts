import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAiQueryDto } from './dto/create-ai.dto';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prismaService: PrismaService) {}
  async create(createAiDto: CreateAiQueryDto) {
    return await this.prismaService.aIQuery.create({
      data: {
        userId: createAiDto.userId,
        query: createAiDto.query,
      },
    });
  }

  async findAll() {
    return await this.prismaService.aIQuery.findMany({
      where: { deletedAt: null },
    });
  }
  async findOne(id: string) {
    const query = await this.prismaService.aIQuery.findUnique({
      where: { id },
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

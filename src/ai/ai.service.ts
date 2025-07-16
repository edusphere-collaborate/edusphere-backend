import { Injectable } from '@nestjs/common';
import { CreateAiDto } from './dto/create-ai.dto';
import { UpdateAiDto } from './dto/update-ai.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}
  create(createAiDto: CreateAiDto) {
    return this.prisma.aIQuery.createManyAndReturn({
      data: createAiDto,
    });
  }

  findAll() {
    return this.prisma.aIQuery.findMany();
  }

  findOne(id: string) {
    return this.prisma.aIQuery.findUnique({
      where: { id: id },
    });
  }

  update(id: string, updateAiDto: UpdateAiDto) {
    return this.prisma.aIQuery.update({
      where: { id: id },
      data: updateAiDto,
    });
  }

  remove(id: string) {
    return this.prisma.aIQuery.update({
      where: { id: id },
      data: { deletedAt: new Date() },
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RoomsGatewayService {
  constructor(private readonly prisma: PrismaService) {}

  // Get user details (useful for broadcasting username, etc.)
  async getUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  // Save new message to DB
  async createMessage(userId: string, roomId: string, content: string) {
    return this.prisma.message.create({
      data: {
        userId,
        roomId,
        content,
      },
    });
  }

  // Optional: Get all messages in a room
  async getRoomMessages(roomId: string) {
    return this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { username: true },
        },
      },
    });
  }
}

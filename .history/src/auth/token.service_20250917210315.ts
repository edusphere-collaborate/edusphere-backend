import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { generateTokenUrlSafe, hashToken } from './utils/token.util';
import { TokenType } from '@prisma/client'; // make sure prisma
// client generated
import t

import { addSeconds } from 'date-fns';

@Injectable()
export class TokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createToken(userId: string, type: TokenType, expiresInSeconds: number) {
    const rawToken = generateTokenUrlSafe(48); // strong token
    const tokenHash = hashToken(rawToken);
    const expiresAt = addSeconds(new Date(), expiresInSeconds);

    await this.prisma.token.create({
      data: {
        type,
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return { rawToken, expiresAt };
  }

  async validateAndConsumeToken(rawToken: string, type: TokenType) {
    const tokenHash = hashToken(rawToken);
    const token = await this.prisma.token.findFirst({
      where: {
        tokenHash,
        type,
      },
      include: { user: true },
    });

    if (!token) return null;
    if (token.expiresAt < new Date()) {
      // token expired: remove it
      await this.prisma.token.delete({ where: { id: token.id } });
      return null;
    }

    // delete token after use (one-time)
    await this.prisma.token.delete({ where: { id: token.id } });

    return token; // contains user
  }

  async cleanupExpiredTokens() {
    await this.prisma.token.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

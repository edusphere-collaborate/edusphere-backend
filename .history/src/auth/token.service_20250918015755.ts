import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { hashToken } from './utils/token.util';

@Injectable()
export class TokenService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Creates a new token for a user
   * @param userId User ID
   * @param type Token type (EMAIL_VERIFICATION, PASSWORD_RESET)
   * @param expiresInSeconds Expiration time in seconds
   * @returns Raw token and expiration date
   */
  async createToken(
    userId: string,
    type: TokenType,
    expiresInSeconds: number,
  ): Promise<{ rawToken: string; expiresAt: Date }> {
    // Generate a random token
    const rawToken = uuidv4();
    
    // Hash the token for storage
    const tokenHash = hashToken(rawToken);
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresInSeconds);

    // Save the token in the database
    await this.prismaService.token.create({
      data: {
        userId,
        tokenHash,
        type,
        expiresAt,
      },
    });

    return { rawToken, expiresAt };
  }

  /**
   * Validates and consumes a token
   * @param rawToken Raw token string
   * @param type Token type
   * @returns Token record if valid, null otherwise
   */
  async validateAndConsumeToken(rawToken: string, type: TokenType) {
    // Hash the token to compare with stored hash
    const tokenHash = hashToken(rawToken);

    // Find the token
    const token = await this.prismaService.token.findFirst({
      where: {
        tokenHash,
        type,
        expiresAt: { gt: new Date() }, // Not expired
        consumedAt: null, // Not consumed
      },
      include: { user: true },
    });

    if (!token) {
      return null;
    }

    // Mark the token as consumed
    await this.prismaService.token.update({
      where: { id: token.id },
      data: { consumedAt: new Date() },
    });

    return token;
  }
}

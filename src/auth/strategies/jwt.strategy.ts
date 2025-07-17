import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JWTPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prismaService: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: (() => {
        if (!process.env.JWT_SECRET) {
          throw new Error(
            'JWT_SECRET environment variable is not set. Please configure it to secure your application.',
          );
        }
        return process.env.JWT_SECRET;
      })(),
    });
  }

  async validate(payload: JWTPayload) {
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub }, // uses 'sub' from the token
    });

    if (!user) {
      throw new UnauthorizedException('Token invalid or user not found');
    }

    return {
      id: user.id, // this will be available as req.user
      username: user.username,
      email: user.email,
      isAdmin: user.role === 'ADMIN',
    };
  }
}

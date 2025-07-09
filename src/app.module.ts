import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { MediaModule } from './media/media.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    UsersModule,
    RoomsModule,
    MediaModule,
    AiModule,
    AuthModule,
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time window in milliseconds (e.g., 60 seconds)
        limit: 6, // Maximum number of requests allowed within the ttl
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

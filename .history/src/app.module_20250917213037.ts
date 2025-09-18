import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { MediaModule } from './media/media.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RoomsGatewayModule } from './rooms-gateway/rooms-gateway.module';
import { RoomsGatewayGateway } from './rooms-gateway/rooms-gateway.gateway';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      {
        name: 'short'
      }
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    RoomsModule,
    MediaModule,
    AiModule,
    AuthModule,
    PrismaModule,
    RoomsGatewayModule,
  ],
  controllers: [AppController],
  providers: [AppService, RoomsGatewayGateway],
})
export class AppModule {}

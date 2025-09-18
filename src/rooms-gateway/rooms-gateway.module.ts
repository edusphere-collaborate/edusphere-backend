import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomsGatewayService } from './rooms-gateway.service';
import { RoomsService } from 'src/rooms/rooms.service';

@Module({
  providers: [PrismaService, RoomsGatewayService, RoomsService],
  exports: [RoomsGatewayService],
})
export class RoomsGatewayModule {}

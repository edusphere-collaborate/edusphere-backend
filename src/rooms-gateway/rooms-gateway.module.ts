import { Module } from '@nestjs/common';
import { RoomsGatewayGateway } from './rooms-gateway.gateway';
import { RoomsService } from 'src/rooms/rooms.service';

@Module({
  imports: [RoomsService],
  providers: [RoomsGatewayGateway],
})
export class RoomsGatewayModule {}

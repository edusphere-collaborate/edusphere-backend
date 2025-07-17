import { Module } from '@nestjs/common';
import { RoomsGatewayGateway } from './rooms-gateway.gateway';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [RoomsModule],
  providers: [RoomsGatewayGateway],
})
export class RoomsGatewayModule {}

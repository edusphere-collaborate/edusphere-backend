import { NotFoundException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';

@WebSocketGateway({ port: 3001, cors: { origin: '*' } })
export class RoomsGatewayGateway {
  constructor(private readonly roomService: RoomsService) {}

  @WebSocketServer()
  server: Server;

  /**
   * Handle when a user joins a room.
   * Payload: { room_id, user_id }
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    // const room = await this.roomService.findOne(data.room_id);

    // if (!room) {
    //   client.emit('error', { message: 'Room Not Found' });
    //   throw new NotFoundException('Room not found');
    // }

    // Let the client join the room (socket.io level)
    await client.join(data.room_id);

    // Optionally: fetch username from the DB or mock it here
    const username = `User_${data.user_id}`;

    // Broadcast to other users in the room
    client.broadcast.to(data.room_id).emit('user-joined', {
      user_id: data.user_id,
      username: username,
    });
  }

  @SubscribeMessage('send-message')
  handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    // const message = await this.roomService.
    console.log('Message received:', data);
  }
}

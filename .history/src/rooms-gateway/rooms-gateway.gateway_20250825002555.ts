import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from 'src/rooms/rooms.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomsGatewayGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  afterInit() {
    console.log('✅ WebSocket Server Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  /**
   * Create a room
   */
  @SubscribeMessage('create-room')
  async handleCreateRoom(
    @MessageBody()
    data: {
      name: string;
      description?: string;
      slug: string;
      user_id: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomsService.create({
        name: data.name,
        description: data.description,
        slug: data.slug,
        creatorId: data.user_id,
      });

      client.emit('room-created', {
        id: room.id,
        name: room.name,
        slug: room.slug,
        description: room.description,
        creatorId: room.creatorId,
        createdAt: room.createdAt,
      });

      console.log(`🏠 Room "${room.name}" created by user ${data.user_id}`);
    } catch (error) {
      console.error('❗ Error creating room:', error);
      client.emit('error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Join a room
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: { room_id: string; user_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room_id, user_id } = data;

    try {
      // Add user to room (many-to-many relation)
      await this.roomsService.addUserToRoom(room_id, user_id);

      // Actually join the WebSocket room
      await client.join(room_id);

      // Get the user details
      const user = await this.roomsService['prisma'].user.findUnique({
        where: { id: user_id },
      });

      this.server.to(room_id).emit('user-joined', {
        user_id,
        username: user?.username ?? 'Unknown',
      });

      console.log(`✅ ${user?.username} joined room ${room_id}`);
    } catch (error) {
      console.error('❗ Error joining room:', error);
      client.emit('error', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Send a message
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody()
    data: {
      room_id: string;
      user_id: string;
      content: string;
    },
  ) {
    try {
      const message = await this.roomsService.createMessage({
        content: data.content,
        roomId: data.room_id,
        userId: data.user_id,
      });

      this.server.to(data.room_id).emit('new-message', {
        id: message.id,
        room_id: message.roomId,
        user_id: message.userId,
        content: message.content,
        sent_at: message.createdAt,
        user: message.user,
      });

      console.log(
        `📨 Message sent by ${message.user.username} in room ${data.room_id}`,
      );
    } catch (error) {
      console.error('❗ Error sending message:', error.message);
    }
  }
}

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  port: 3001,
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class RoomsGatewayGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(RoomsGatewayGateway.name);
  private connectedUsers = new Map<
    string,
    { userId: string; username: string; roomId?: string }
  >();

  constructor(private readonly roomService: RoomsService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Clean up user connection
    const userInfo = this.connectedUsers.get(client.id);
    if (userInfo && userInfo.roomId) {
      // Notify others in the room that user left
      client.broadcast.to(userInfo.roomId).emit('user-left', {
        user_id: userInfo.userId,
        username: userInfo.username,
      });
    }

    this.connectedUsers.delete(client.id);
  }

  /**
   * Handle when a user joins a room.
   * Payload: { room_id, user_id }
   */
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Verify room exists
      const room = await this.roomService.findOne(data.room_id);
      if (!room) {
        client.emit('error', { message: 'Room not found' });
        return;
      }

      // Let the client join the room (socket.io level)
      await client.join(data.room_id);

      // Store user connection info
      this.connectedUsers.set(client.id, {
        userId: data.user_id,
        username: `User_${data.user_id}`, // In production, fetch from DB
        roomId: data.room_id,
      });

      // Notify client they joined successfully
      client.emit('joined-room', {
        room_id: data.room_id,
        user_id: data.user_id,
        message: `Successfully joined room: ${room.name}`,
      });

      // Broadcast to other users in the room
      client.broadcast.to(data.room_id).emit('user-joined', {
        user_id: data.user_id,
        username: `User_${data.user_id}`,
        message: `User ${data.user_id} joined the room`,
      });

      this.logger.log(`User ${data.user_id} joined room ${data.room_id}`);
    } catch (error) {
      this.logger.error(
        `Error joining room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  /**
   * Handle when a user leaves a room.
   * Payload: { room_id, user_id }
   */
  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @MessageBody() data: { room_id: string; user_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Leave the room
      await client.leave(data.room_id);

      // Update user connection info
      const userInfo = this.connectedUsers.get(client.id);
      if (userInfo) {
        userInfo.roomId = undefined;
        this.connectedUsers.set(client.id, userInfo);
      }

      // Notify client they left successfully
      client.emit('left-room', {
        room_id: data.room_id,
        user_id: data.user_id,
        message: `Successfully left room`,
      });

      // Broadcast to other users in the room
      client.broadcast.to(data.room_id).emit('user-left', {
        user_id: data.user_id,
        username: `User_${data.user_id}`,
        message: `User ${data.user_id} left the room`,
      });

      this.logger.log(`User ${data.user_id} left room ${data.room_id}`);
    } catch (error) {
      this.logger.error(
        `Error leaving room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      client.emit('error', { message: 'Failed to leave room' });
    }
  }

  /**
   * Handle sending a message to a room.
   * Payload: { room_id, user_id, content }
   */
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Create message in database
      const message = await this.roomService.createMessage({
        content: data.content,
        userId: data.user_id,
        roomId: data.room_id,
      });

      // Prepare message data for broadcasting
      const messageData = {
        id: message.id,
        room_id: data.room_id,
        user_id: data.user_id,
        content: data.content,
        user: message.user,
        sent_at: message.createdAt,
      };

      // Broadcast to all users in the room (including sender)
      this.server.to(data.room_id).emit('new-message', messageData);

      this.logger.log(
        `Message sent in room ${data.room_id} by user ${data.user_id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error sending message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicator
   * Payload: { room_id, user_id, is_typing }
   */
  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    data: { room_id: string; user_id: string; is_typing: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    // Broadcast typing status to others in the room (not including sender)
    client.broadcast.to(data.room_id).emit('user-typing', {
      user_id: data.user_id,
      username: `User_${data.user_id}`,
      is_typing: data.is_typing,
    });
  }

  /**
   * Get room info
   * Payload: { room_id }
   */
  @SubscribeMessage('get-room-info')
  async handleGetRoomInfo(
    @MessageBody() data: { room_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const room = await this.roomService.findOne(data.room_id);
      if (!room) {
        client.emit('error', { message: 'Room not found' });
        return;
      }

      client.emit('room-info', {
        room: {
          id: room.id,
          name: room.name,
          description: room.description,
          creator: room.creator,
          userCount: room._count.users,
          messageCount: room._count.messages,
        },
      });
    } catch (error) {
      this.logger.error(
        `Error getting room info: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      client.emit('error', { message: 'Failed to get room info' });
    }
  }
}

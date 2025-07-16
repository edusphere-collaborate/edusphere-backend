// src/rooms/dto/create-room.dto.ts

import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsString()
  slug: string;

  @IsString()
  @IsNotEmpty()
  creatorId: string; // This connects to the User who created the room
}

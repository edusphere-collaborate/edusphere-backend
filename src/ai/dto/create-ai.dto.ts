// src/ai-query/dto/create-ai.dto.ts

import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateAiDto {
  @IsString()
  query: string; // Question sent by user

  @IsOptional()
  response?: any; // Optional response from AI

  @IsUUID()
  userId: string; // Foreign key to User
}

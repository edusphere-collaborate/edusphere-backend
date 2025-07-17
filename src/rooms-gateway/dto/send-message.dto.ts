import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;
  @IsString()
  @IsNotEmpty()
  user_id: string;
  @IsString()
  @IsNotEmpty()
  content: string;
}

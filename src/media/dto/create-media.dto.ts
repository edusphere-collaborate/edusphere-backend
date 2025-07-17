import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsEnum(MediaType)
  @IsNotEmpty()
  type: MediaType;

  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}

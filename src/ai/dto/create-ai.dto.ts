import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAiQueryDto {
  @IsUUID()
  userId: string;

  @IsString()
  @IsNotEmpty()
  query: string;
}

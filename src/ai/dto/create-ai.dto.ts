import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateAiQueryDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  query: string;
}

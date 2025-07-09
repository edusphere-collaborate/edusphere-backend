import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateRoomDto {
  @IsString({ message: 'Name must be a string' })
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  @MaxLength(50, { message: 'Name must not exceed 50 characters' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @IsString({ message: 'Slug must be a string' })
  @MinLength(3, { message: 'Slug must be at least 3 characters' })
  @MaxLength(40, { message: 'Slug must not exceed 40 characters' })
  slug: string;
  @IsUUID(undefined, { message: 'CreatorId must be a valid UUID of a User' })
  creatorId: string;
}

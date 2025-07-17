import { PartialType } from '@nestjs/mapped-types';
import { CreateAiQueryDto } from './create-ai.dto';

export class UpdateAiDto extends PartialType(CreateAiQueryDto) {}

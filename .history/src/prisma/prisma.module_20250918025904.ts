import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MediaController } from 'src/media/media.controller';
import { MediaService } from 'src/media/media.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PrismaService, MediaService],
  exports: [PrismaService, MediaService], // ensure PrismaService is available app-wide
  controllers: [MediaController],
})
export class PrismaModule { }

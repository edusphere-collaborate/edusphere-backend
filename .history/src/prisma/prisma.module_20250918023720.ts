import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { MediaController } from 'src/media/media.controller';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // ensure PrismaService is available app-wide
  controllers: [MediaController],
})
export class PrismaModule {}

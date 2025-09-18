import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // ensure PrismaService is available app-wide
  controllers: [Media],
})
export class PrismaModule {}

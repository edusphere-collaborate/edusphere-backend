import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins
  app.enableCors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: [
      '*',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://edusphere-learning-platform.vercel.app',
    ],
    credentials: true,
  });

  app.useWebSocketAdapter(new IoAdapter(app));

  // IMPORTANT: Use Render's PORT and bind to 0.0.0.0
  const port = parseInt(process.env.PORT as string, 10) || 3001;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Application is running on port ${port}`);
}
bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});

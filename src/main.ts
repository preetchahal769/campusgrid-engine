import './instrument';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable security headers
  app.use(helmet());
  
  // Enable cookie parsing
  app.use(cookieParser());
  
  // Enable CORS (Cross-Origin Resource Sharing)
  const envOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const allowedOrigins = [
    ...envOrigins
  ];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    transform: true 
  }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

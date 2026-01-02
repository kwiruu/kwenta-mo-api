import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://kwenta-mo.vercel.app",
    process.env.FRONTEND_URL,
  ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Global prefix
  app.setGlobalPrefix("api");

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle("KwentaMo API")
    .setDescription("Food Business Costing Assistant API")
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User profile management")
    .addTag("ingredients", "Ingredient management")
    .addTag("recipes", "Recipe management")
    .addTag("sales", "Sales tracking")
    .addTag("expenses", "Expense tracking")
    .addTag("reports", "Financial reports")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 KwentaMo API running on http://localhost:${port}/api`);
  console.log(`📚 Swagger docs at http://localhost:${port}/docs`);
}

bootstrap();

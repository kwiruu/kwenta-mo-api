import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { IngredientsModule } from "./ingredients/ingredients.module";
import { RecipesModule } from "./recipes/recipes.module";
import { SalesModule } from "./sales/sales.module";
import { ExpensesModule } from "./expenses/expenses.module";
import { ReportsModule } from "./reports/reports.module";

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    // Database
    PrismaModule,
    // Feature modules
    AuthModule,
    UsersModule,
    IngredientsModule,
    RecipesModule,
    SalesModule,
    ExpensesModule,
    ReportsModule,
  ],
})
export class AppModule {}

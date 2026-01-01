import { Module } from "@nestjs/common";
import { SalesController } from "./sales.controller";
import { SalesService } from "./sales.service";
import { AuthModule } from "../auth/auth.module";
import { RecipesModule } from "../recipes/recipes.module";

@Module({
  imports: [AuthModule, RecipesModule],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}

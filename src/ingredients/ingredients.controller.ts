import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { IngredientsService } from "./ingredients.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { UpdateIngredientDto } from "./dto/update-ingredient.dto";

@ApiTags("ingredients")
@ApiBearerAuth()
@Controller("ingredients")
@UseGuards(SupabaseAuthGuard)
export class IngredientsController {
  constructor(private ingredientsService: IngredientsService) {}

  @Get()
  async findAll(@Request() req: any, @Query("category") category?: string) {
    return this.ingredientsService.findAll(req.user.id, category);
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.ingredientsService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateIngredientDto) {
    return this.ingredientsService.create(req.user.id, dto);
  }

  @Post("bulk")
  async createBulk(@Request() req: any, @Body() dtos: CreateIngredientDto[]) {
    return this.ingredientsService.createBulk(req.user.id, dtos);
  }

  @Put(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateIngredientDto
  ) {
    return this.ingredientsService.update(req.user.id, id, dto);
  }

  @Delete(":id")
  async delete(@Request() req: any, @Param("id") id: string) {
    return this.ingredientsService.delete(req.user.id, id);
  }

  @Get("low-stock")
  async getLowStock(@Request() req: any) {
    return this.ingredientsService.getLowStock(req.user.id);
  }
}

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
import { RecipesService } from "./recipes.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { UpdateRecipeDto } from "./dto/update-recipe.dto";

@ApiTags("recipes")
@ApiBearerAuth()
@Controller("recipes")
@UseGuards(SupabaseAuthGuard)
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Get()
  async findAll(@Request() req: any, @Query("category") category?: string) {
    return this.recipesService.findAll(req.user.id, category);
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.recipesService.findOne(req.user.id, id);
  }

  @Get(":id/cost")
  async calculateCost(@Request() req: any, @Param("id") id: string) {
    return this.recipesService.calculateCost(req.user.id, id);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateRecipeDto) {
    return this.recipesService.create(req.user.id, dto);
  }

  @Put(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateRecipeDto
  ) {
    return this.recipesService.update(req.user.id, id, dto);
  }

  @Delete(":id")
  async delete(@Request() req: any, @Param("id") id: string) {
    return this.recipesService.delete(req.user.id, id);
  }
}

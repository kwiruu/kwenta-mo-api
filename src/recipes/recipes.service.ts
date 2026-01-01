import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRecipeDto } from "./dto/create-recipe.dto";
import { UpdateRecipeDto } from "./dto/update-recipe.dto";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, category?: string) {
    return this.prisma.recipe.findMany({
      where: {
        userId,
        ...(category && { category }),
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(userId: string, id: string) {
    const recipe = await this.prisma.recipe.findFirst({
      where: { id, userId },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException("Recipe not found");
    }

    return recipe;
  }

  async calculateCost(userId: string, id: string) {
    const recipe = await this.findOne(userId, id);

    // Calculate ingredient cost
    let ingredientCost = 0;
    for (const ri of recipe.ingredients) {
      const qty = Number(ri.quantity);
      const cost = Number(ri.ingredient.costPerUnit);
      ingredientCost += qty * cost;
    }

    const laborCost = Number(recipe.laborCost);
    const overheadCost = Number(recipe.overheadCost);
    const totalCost = ingredientCost + laborCost + overheadCost;
    const sellingPrice = Number(recipe.sellingPrice);
    const profit = sellingPrice - totalCost;
    const profitMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const costPerServing =
      recipe.servings > 0 ? totalCost / recipe.servings : totalCost;

    return {
      recipeId: id,
      recipeName: recipe.name,
      ingredientCost,
      laborCost,
      overheadCost,
      totalCost,
      sellingPrice,
      profit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      costPerServing: Math.round(costPerServing * 100) / 100,
      servings: recipe.servings,
    };
  }

  async create(userId: string, dto: CreateRecipeDto) {
    const { ingredients, ...recipeData } = dto;

    return this.prisma.recipe.create({
      data: {
        userId,
        ...recipeData,
        ingredients: {
          create: ingredients?.map((ing) => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.notes,
          })),
        },
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateRecipeDto) {
    await this.findOne(userId, id); // Verify ownership

    const { ingredients, ...recipeData } = dto;

    // If ingredients are provided, replace all
    if (ingredients) {
      await this.prisma.recipeIngredient.deleteMany({
        where: { recipeId: id },
      });
    }

    return this.prisma.recipe.update({
      where: { id },
      data: {
        ...recipeData,
        ...(ingredients && {
          ingredients: {
            create: ingredients.map((ing) => ({
              ingredientId: ing.ingredientId,
              quantity: ing.quantity,
              unit: ing.unit,
              notes: ing.notes,
            })),
          },
        }),
      },
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id); // Verify ownership

    return this.prisma.recipe.delete({ where: { id } });
  }
}

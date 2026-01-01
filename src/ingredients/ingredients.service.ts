import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIngredientDto } from "./dto/create-ingredient.dto";
import { UpdateIngredientDto } from "./dto/update-ingredient.dto";

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, category?: string) {
    return this.prisma.ingredient.findMany({
      where: {
        userId,
        ...(category && { category }),
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(userId: string, id: string) {
    const ingredient = await this.prisma.ingredient.findFirst({
      where: { id, userId },
    });

    if (!ingredient) {
      throw new NotFoundException("Ingredient not found");
    }

    return ingredient;
  }

  async create(userId: string, dto: CreateIngredientDto) {
    return this.prisma.ingredient.create({
      data: {
        userId,
        ...dto,
      },
    });
  }

  async createBulk(userId: string, dtos: CreateIngredientDto[]) {
    const data = dtos.map((dto) => ({ userId, ...dto }));
    return this.prisma.ingredient.createMany({ data });
  }

  async update(userId: string, id: string, dto: UpdateIngredientDto) {
    await this.findOne(userId, id); // Verify ownership

    return this.prisma.ingredient.update({
      where: { id },
      data: dto,
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id); // Verify ownership

    return this.prisma.ingredient.delete({ where: { id } });
  }

  async getLowStock(userId: string) {
    return this.prisma.ingredient.findMany({
      where: {
        userId,
        currentStock: {
          lte: this.prisma.ingredient.fields.reorderLevel,
        },
      },
    });
  }
}

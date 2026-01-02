import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { RecipesService } from "../recipes/recipes.service";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private recipesService: RecipesService
  ) {}

  async findAll(
    userId: string,
    filters: { startDate?: string; endDate?: string; recipeId?: string }
  ) {
    return this.prisma.sale.findMany({
      where: {
        userId,
        ...(filters.recipeId && { recipeId: filters.recipeId }),
        ...(filters.startDate && {
          saleDate: { gte: new Date(filters.startDate) },
        }),
        ...(filters.endDate && {
          saleDate: { lte: new Date(filters.endDate) },
        }),
      },
      include: { recipe: true },
      orderBy: { saleDate: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, userId },
      include: { recipe: true },
    });

    if (!sale) {
      throw new NotFoundException("Sale not found");
    }

    return sale;
  }

  async create(userId: string, dto: CreateSaleDto) {
    // Calculate cost and profit from recipe
    const costData = await this.recipesService.calculateCost(
      userId,
      dto.recipeId
    );

    // Use provided unitPrice or fetch from recipe
    const unitPrice = dto.unitPrice ?? costData.sellingPrice;
    const costOfGoods = costData.totalCost * dto.quantity;
    const totalPrice = unitPrice * dto.quantity;
    const profit = totalPrice - costOfGoods;

    return this.prisma.sale.create({
      data: {
        userId,
        recipeId: dto.recipeId,
        quantity: dto.quantity,
        unitPrice,
        totalPrice,
        costOfGoods,
        profit,
        saleDate: dto.saleDate ? new Date(dto.saleDate) : new Date(),
        notes: dto.notes,
      },
      include: { recipe: true },
    });
  }

  async update(userId: string, id: string, dto: UpdateSaleDto) {
    const existing = await this.findOne(userId, id);

    // Recalculate if quantity or price changed
    let costOfGoods = Number(existing.costOfGoods);
    let totalPrice = Number(existing.totalPrice);
    let profit = Number(existing.profit);

    if (dto.quantity || dto.unitPrice) {
      const costData = await this.recipesService.calculateCost(
        userId,
        dto.recipeId || existing.recipeId
      );
      const qty = dto.quantity ?? existing.quantity;
      const price = dto.unitPrice ?? Number(existing.unitPrice);
      costOfGoods = costData.totalCost * qty;
      totalPrice = price * qty;
      profit = totalPrice - costOfGoods;
    }

    return this.prisma.sale.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.saleDate && { saleDate: new Date(dto.saleDate) }),
        totalPrice,
        costOfGoods,
        profit,
      },
      include: { recipe: true },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.sale.delete({ where: { id } });
  }

  async getStats(userId: string, startDate?: string, endDate?: string) {
    const where = {
      userId,
      ...(startDate && { saleDate: { gte: new Date(startDate) } }),
      ...(endDate && { saleDate: { lte: new Date(endDate) } }),
    };

    const aggregate = await this.prisma.sale.aggregate({
      where,
      _sum: {
        totalPrice: true,
        costOfGoods: true,
        profit: true,
        quantity: true,
      },
      _count: true,
    });

    return {
      totalRevenue: Number(aggregate._sum.totalPrice) || 0,
      totalCost: Number(aggregate._sum.costOfGoods) || 0,
      totalProfit: Number(aggregate._sum.profit) || 0,
      totalQuantity: aggregate._sum.quantity || 0,
      salesCount: aggregate._count,
    };
  }
}

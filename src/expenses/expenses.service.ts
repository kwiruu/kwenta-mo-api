import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpenseCategory } from "@prisma/client";

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    userId: string,
    filters: { category?: string; startDate?: string; endDate?: string }
  ) {
    const where: any = { userId };

    // Add category filter
    if (filters.category) {
      where.category = filters.category as ExpenseCategory;
    }

    // Add date range filter
    if (filters.startDate || filters.endDate) {
      where.expenseDate = {};
      if (filters.startDate) {
        where.expenseDate.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.expenseDate.lte = endDate;
      }
    }

    return this.prisma.expense.findMany({
      where,
      orderBy: { expenseDate: "desc" },
    });
  }

  async findOne(userId: string, id: string) {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw new NotFoundException("Expense not found");
    }

    return expense;
  }

  async create(userId: string, dto: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: {
        userId,
        category: dto.category as ExpenseCategory,
        description: dto.description,
        amount: dto.amount,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
      },
    });
  }

  async createBulk(userId: string, dtos: CreateExpenseDto[]) {
    const data = dtos.map((dto) => ({
      userId,
      category: dto.category as ExpenseCategory,
      description: dto.description,
      amount: dto.amount,
      expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
      receiptUrl: dto.receiptUrl,
      notes: dto.notes,
    }));

    return this.prisma.expense.createMany({ data });
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto) {
    await this.findOne(userId, id);

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.category && { category: dto.category as ExpenseCategory }),
        ...(dto.expenseDate && { expenseDate: new Date(dto.expenseDate) }),
      },
    });
  }

  async delete(userId: string, id: string) {
    await this.findOne(userId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  async getStats(userId: string, startDate?: string, endDate?: string) {
    const where: any = {
      userId,
    };

    // Add date range filter if provided
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) {
        where.expenseDate.gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.expenseDate.lte = endDateTime;
      }
    }

    // Total expenses
    const total = await this.prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
    });

    // By category
    const byCategory = await this.prisma.expense.groupBy({
      by: ["category"],
      where,
      _sum: { amount: true },
      _count: true,
    });

    return {
      total: Number(total._sum.amount) || 0,
      byCategory: byCategory.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount) || 0,
        count: c._count,
      })),
    };
  }
}

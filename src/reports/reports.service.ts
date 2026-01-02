import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as ExcelJS from "exceljs";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // COGS Report - Cost of Goods Sold
  async getCOGSReport(userId: string, startDate?: string, endDate?: string) {
    const dateFilter = this.buildDateFilter(startDate, endDate, "saleDate");

    const sales = await this.prisma.sale.findMany({
      where: { userId, ...dateFilter },
      include: { recipe: true },
    });

    const totalRevenue = sales.reduce(
      (sum, s) => sum + Number(s.totalPrice),
      0
    );
    const totalCOGS = sales.reduce((sum, s) => sum + Number(s.costOfGoods), 0);
    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Group by recipe
    const byRecipe = sales.reduce(
      (acc, sale) => {
        const key = sale.recipeId;
        if (!acc[key]) {
          acc[key] = {
            recipeId: key,
            recipeName: sale.recipe.name,
            quantity: 0,
            revenue: 0,
            cogs: 0,
            profit: 0,
          };
        }
        acc[key].quantity += sale.quantity;
        acc[key].revenue += Number(sale.totalPrice);
        acc[key].cogs += Number(sale.costOfGoods);
        acc[key].profit += Number(sale.profit);
        return acc;
      },
      {} as Record<string, any>
    );

    return {
      period: { startDate, endDate },
      summary: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
      },
      byRecipe: Object.values(byRecipe),
    };
  }

  // Income Statement
  async getIncomeStatement(
    userId: string,
    startDate?: string,
    endDate?: string
  ) {
    const salesDateFilter = this.buildDateFilter(
      startDate,
      endDate,
      "saleDate"
    );
    const expenseDateFilter = this.buildDateFilter(
      startDate,
      endDate,
      "expenseDate"
    );

    // Revenue from sales
    const salesAggregate = await this.prisma.sale.aggregate({
      where: { userId, ...salesDateFilter },
      _sum: { totalPrice: true, costOfGoods: true, profit: true },
    });

    // Expenses by category
    const expensesByCategory = await this.prisma.expense.groupBy({
      by: ["category"],
      where: { userId, ...expenseDateFilter },
      _sum: { amount: true },
    });

    const totalRevenue = Number(salesAggregate._sum.totalPrice) || 0;
    const totalCOGS = Number(salesAggregate._sum.costOfGoods) || 0;
    const grossProfit = totalRevenue - totalCOGS;

    const operatingExpenses = expensesByCategory.reduce(
      (sum, e) => sum + Number(e._sum.amount),
      0
    );

    const netProfit = grossProfit - operatingExpenses;
    const netProfitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      period: { startDate, endDate },
      revenue: {
        sales: totalRevenue,
        totalRevenue,
      },
      costOfGoodsSold: totalCOGS,
      grossProfit,
      operatingExpenses: {
        total: operatingExpenses,
        breakdown: expensesByCategory.map((e) => ({
          category: e.category,
          amount: Number(e._sum.amount) || 0,
        })),
      },
      netProfit,
      netProfitMargin: Math.round(netProfitMargin * 100) / 100,
    };
  }

  // Profit Summary by Recipe
  async getProfitSummary(userId: string, startDate?: string, endDate?: string) {
    const dateFilter = this.buildDateFilter(startDate, endDate, "saleDate");

    const salesByRecipe = await this.prisma.sale.groupBy({
      by: ["recipeId"],
      where: { userId, ...dateFilter },
      _sum: {
        quantity: true,
        totalPrice: true,
        costOfGoods: true,
        profit: true,
      },
      _count: true,
    });

    // Get recipe names
    const recipeIds = salesByRecipe.map((s) => s.recipeId);
    const recipes = await this.prisma.recipe.findMany({
      where: { id: { in: recipeIds } },
      select: { id: true, name: true, sellingPrice: true },
    });

    const recipeMap = new Map(recipes.map((r) => [r.id, r]));

    const summary = salesByRecipe.map((s) => {
      const recipe = recipeMap.get(s.recipeId);
      const revenue = Number(s._sum.totalPrice) || 0;
      const cogs = Number(s._sum.costOfGoods) || 0;
      const profit = Number(s._sum.profit) || 0;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        recipeId: s.recipeId,
        recipeName: recipe?.name || "Unknown",
        sellingPrice: Number(recipe?.sellingPrice) || 0,
        quantitySold: s._sum.quantity || 0,
        revenue,
        costOfGoods: cogs,
        profit,
        profitMargin: Math.round(margin * 100) / 100,
        salesCount: s._count,
      };
    });

    // Sort by profit descending
    summary.sort((a, b) => b.profit - a.profit);

    return {
      period: { startDate, endDate },
      recipes: summary,
      totals: {
        revenue: summary.reduce((sum, r) => sum + r.revenue, 0),
        cogs: summary.reduce((sum, r) => sum + r.costOfGoods, 0),
        profit: summary.reduce((sum, r) => sum + r.profit, 0),
      },
    };
  }

  // Expense Breakdown
  async getExpenseBreakdown(
    userId: string,
    startDate?: string,
    endDate?: string
  ) {
    const dateFilter = this.buildDateFilter(startDate, endDate, "expenseDate");

    const byCategory = await this.prisma.expense.groupBy({
      by: ["category"],
      where: { userId, ...dateFilter },
      _sum: { amount: true },
      _count: true,
    });

    const total = byCategory.reduce((sum, c) => sum + Number(c._sum.amount), 0);

    return {
      period: { startDate, endDate },
      total,
      breakdown: byCategory.map((c) => ({
        category: c.category,
        amount: Number(c._sum.amount) || 0,
        count: c._count,
        percentage:
          total > 0
            ? Math.round((Number(c._sum.amount) / total) * 10000) / 100
            : 0,
      })),
    };
  }

  // Dashboard Summary
  async getDashboardSummary(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month stats
    const currentMonthSales = await this.prisma.sale.aggregate({
      where: { userId, saleDate: { gte: startOfMonth } },
      _sum: { totalPrice: true, costOfGoods: true, profit: true },
    });

    const currentMonthExpenses = await this.prisma.expense.aggregate({
      where: { userId, expenseDate: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    // Last month stats
    const lastMonthSales = await this.prisma.sale.aggregate({
      where: {
        userId,
        saleDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalPrice: true, profit: true },
    });

    const lastMonthExpenses = await this.prisma.expense.aggregate({
      where: {
        userId,
        expenseDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    });

    // Low stock ingredients
    const lowStockCount = await this.prisma.ingredient.count({
      where: {
        userId,
        currentStock: { lte: 10 }, // Simple threshold for now
      },
    });

    // Calculate changes
    const currentRevenue = Number(currentMonthSales._sum.totalPrice) || 0;
    const lastRevenue = Number(lastMonthSales._sum.totalPrice) || 0;
    const revenueChange =
      lastRevenue > 0
        ? ((currentRevenue - lastRevenue) / lastRevenue) * 100
        : 0;

    const currentExpense = Number(currentMonthExpenses._sum.amount) || 0;
    const lastExpense = Number(lastMonthExpenses._sum.amount) || 0;
    const expenseChange =
      lastExpense > 0
        ? ((currentExpense - lastExpense) / lastExpense) * 100
        : 0;

    return {
      currentMonth: {
        revenue: currentRevenue,
        expenses: currentExpense,
        cogs: Number(currentMonthSales._sum.costOfGoods) || 0,
        grossProfit: Number(currentMonthSales._sum.profit) || 0,
        netProfit: Number(currentMonthSales._sum.profit) - currentExpense,
      },
      changes: {
        revenue: Math.round(revenueChange * 100) / 100,
        expenses: Math.round(expenseChange * 100) / 100,
      },
      alerts: {
        lowStockCount,
      },
    };
  }

  // Revenue & Expenses Chart Data
  async getChartData(
    userId: string,
    period: "daily" | "weekly" | "monthly" = "daily"
  ) {
    const now = new Date();
    const data: { name: string; revenue: number; expenses: number }[] = [];

    if (period === "daily") {
      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        const endOfDay = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          23,
          59,
          59,
          999
        );

        const [salesData, expensesData] = await Promise.all([
          this.prisma.sale.aggregate({
            where: { userId, saleDate: { gte: startOfDay, lte: endOfDay } },
            _sum: { totalPrice: true },
          }),
          this.prisma.expense.aggregate({
            where: { userId, expenseDate: { gte: startOfDay, lte: endOfDay } },
            _sum: { amount: true },
          }),
        ]);

        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        data.push({
          name: dayNames[date.getDay()],
          revenue: Number(salesData._sum.totalPrice) || 0,
          expenses: Number(expensesData._sum.amount) || 0,
        });
      }
    } else if (period === "weekly") {
      // Get last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);

        const [salesData, expensesData] = await Promise.all([
          this.prisma.sale.aggregate({
            where: { userId, saleDate: { gte: weekStart, lte: weekEnd } },
            _sum: { totalPrice: true },
          }),
          this.prisma.expense.aggregate({
            where: { userId, expenseDate: { gte: weekStart, lte: weekEnd } },
            _sum: { amount: true },
          }),
        ]);

        data.push({
          name: `Week ${4 - i}`,
          revenue: Number(salesData._sum.totalPrice) || 0,
          expenses: Number(expensesData._sum.amount) || 0,
        });
      }
    } else if (period === "monthly") {
      // Get last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(
          now.getFullYear(),
          now.getMonth() - i + 1,
          0,
          23,
          59,
          59,
          999
        );

        const [salesData, expensesData] = await Promise.all([
          this.prisma.sale.aggregate({
            where: { userId, saleDate: { gte: monthDate, lte: monthEnd } },
            _sum: { totalPrice: true },
          }),
          this.prisma.expense.aggregate({
            where: { userId, expenseDate: { gte: monthDate, lte: monthEnd } },
            _sum: { amount: true },
          }),
        ]);

        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        data.push({
          name: monthNames[monthDate.getMonth()],
          revenue: Number(salesData._sum.totalPrice) || 0,
          expenses: Number(expensesData._sum.amount) || 0,
        });
      }
    }

    return { period, data };
  }

  // Export CSV
  async exportCSV(
    userId: string,
    type: "sales" | "expenses" | "ingredients",
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    let rows: string[] = [];

    if (type === "sales") {
      const dateFilter = this.buildDateFilter(startDate, endDate, "saleDate");
      const sales = await this.prisma.sale.findMany({
        where: { userId, ...dateFilter },
        include: { recipe: true },
        orderBy: { saleDate: "desc" },
      });

      rows.push("Date,Recipe,Quantity,Unit Price,Total Price,COGS,Profit");
      sales.forEach((s) => {
        rows.push(
          `${s.saleDate.toISOString().split("T")[0]},${s.recipe.name},${s.quantity},${s.unitPrice},${s.totalPrice},${s.costOfGoods},${s.profit}`
        );
      });
    } else if (type === "expenses") {
      const dateFilter = this.buildDateFilter(
        startDate,
        endDate,
        "expenseDate"
      );
      const expenses = await this.prisma.expense.findMany({
        where: { userId, ...dateFilter },
        orderBy: { expenseDate: "desc" },
      });

      rows.push("Date,Category,Description,Amount,Notes");
      expenses.forEach((e) => {
        rows.push(
          `${e.expenseDate.toISOString().split("T")[0]},${e.category},"${e.description}",${e.amount},"${e.notes || ""}"`
        );
      });
    } else if (type === "ingredients") {
      const ingredients = await this.prisma.ingredient.findMany({
        where: { userId },
        orderBy: { name: "asc" },
      });

      rows.push(
        "Name,Category,Unit,Cost Per Unit,Current Stock,Reorder Level,Supplier"
      );
      ingredients.forEach((i) => {
        rows.push(
          `"${i.name}","${i.category || ""}",${i.unit},${i.costPerUnit},${i.currentStock},${i.reorderLevel},"${i.supplier || ""}"`
        );
      });
    }

    return rows.join("\n");
  }

  private buildDateFilter(
    startDate?: string,
    endDate?: string,
    field: string = "createdAt"
  ) {
    const filter: any = {};
    if (startDate) {
      filter[field] = { ...filter[field], gte: new Date(startDate) };
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filter[field] = { ...filter[field], lte: endDateTime };
    }
    return filter;
  }

  // Export Excel
  async exportExcel(
    userId: string,
    type: "sales" | "expenses",
    startDate?: string,
    endDate?: string
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kwenta Mo";
    workbook.created = new Date();

    // Get business information
    const business = await this.prisma.business.findUnique({
      where: { userId },
    });
    const businessName = business?.businessName || "My Business";

    if (type === "sales") {
      const dateFilter = this.buildDateFilter(startDate, endDate, "saleDate");
      const sales = await this.prisma.sale.findMany({
        where: { userId, ...dateFilter },
        include: { recipe: true },
        orderBy: { saleDate: "desc" },
      });

      const worksheet = workbook.addWorksheet("Sales Report");

      // Add business name
      worksheet.mergeCells("A1:G1");
      const businessCell = worksheet.getCell("A1");
      businessCell.value = businessName;
      businessCell.font = { size: 18, bold: true };
      businessCell.alignment = { horizontal: "center" };

      // Add title
      worksheet.mergeCells("A2:G2");
      const titleCell = worksheet.getCell("A2");
      titleCell.value = "Sales Report";
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: "center" };

      // Add date range
      worksheet.mergeCells("A3:G3");
      const dateRangeCell = worksheet.getCell("A3");
      dateRangeCell.value = `Period: ${startDate || "All time"} to ${endDate || "Present"}`;
      dateRangeCell.alignment = { horizontal: "center" };

      // Add headers
      const headerRow = worksheet.addRow([
        "Date",
        "Recipe",
        "Quantity",
        "Unit Price (₱)",
        "Total Price (₱)",
        "COGS (₱)",
        "Profit (₱)",
      ]);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF4A7C59" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data rows
      let totalRevenue = 0;
      let totalCOGS = 0;
      let totalProfit = 0;

      sales.forEach((s) => {
        const row = worksheet.addRow([
          s.saleDate.toISOString().split("T")[0],
          s.recipe.name,
          s.quantity,
          Number(s.unitPrice),
          Number(s.totalPrice),
          Number(s.costOfGoods),
          Number(s.profit),
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        totalRevenue += Number(s.totalPrice);
        totalCOGS += Number(s.costOfGoods);
        totalProfit += Number(s.profit);
      });

      // Add totals row
      worksheet.addRow([]);
      const totalsRow = worksheet.addRow([
        "TOTAL",
        "",
        "",
        "",
        totalRevenue,
        totalCOGS,
        totalProfit,
      ]);
      totalsRow.font = { bold: true };
      totalsRow.eachCell((cell, colNumber) => {
        if (colNumber >= 5) {
          cell.numFmt = "₱#,##0.00";
        }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE8F5E9" },
        };
      });

      // Format currency columns
      worksheet.getColumn(4).numFmt = "₱#,##0.00";
      worksheet.getColumn(5).numFmt = "₱#,##0.00";
      worksheet.getColumn(6).numFmt = "₱#,##0.00";
      worksheet.getColumn(7).numFmt = "₱#,##0.00";

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });
      worksheet.getColumn(2).width = 25;
    } else if (type === "expenses") {
      const dateFilter = this.buildDateFilter(
        startDate,
        endDate,
        "expenseDate"
      );
      const expenses = await this.prisma.expense.findMany({
        where: { userId, ...dateFilter },
        orderBy: { expenseDate: "desc" },
      });

      const worksheet = workbook.addWorksheet("Expenses Report");

      // Add business name
      worksheet.mergeCells("A1:E1");
      const businessCell = worksheet.getCell("A1");
      businessCell.value = businessName;
      businessCell.font = { size: 18, bold: true };
      businessCell.alignment = { horizontal: "center" };

      // Add title
      worksheet.mergeCells("A2:E2");
      const titleCell = worksheet.getCell("A2");
      titleCell.value = "Expenses Report";
      titleCell.font = { size: 14, bold: true };
      titleCell.alignment = { horizontal: "center" };

      // Add date range
      worksheet.mergeCells("A3:E3");
      const dateRangeCell = worksheet.getCell("A3");
      dateRangeCell.value = `Period: ${startDate || "All time"} to ${endDate || "Present"}`;
      dateRangeCell.alignment = { horizontal: "center" };

      // Add headers
      const headerRow = worksheet.addRow([
        "Date",
        "Category",
        "Description",
        "Amount (₱)",
        "Notes",
      ]);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFDC3545" },
        };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });

      // Add data rows
      let totalExpenses = 0;

      expenses.forEach((e) => {
        const row = worksheet.addRow([
          e.expenseDate.toISOString().split("T")[0],
          e.category,
          e.description,
          Number(e.amount),
          e.notes || "",
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });

        totalExpenses += Number(e.amount);
      });

      // Add totals row
      worksheet.addRow([]);
      const totalsRow = worksheet.addRow(["TOTAL", "", "", totalExpenses, ""]);
      totalsRow.font = { bold: true };
      totalsRow.eachCell((cell, colNumber) => {
        if (colNumber === 4) {
          cell.numFmt = "₱#,##0.00";
        }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFCE4EC" },
        };
      });

      // Format currency column
      worksheet.getColumn(4).numFmt = "₱#,##0.00";

      // Auto-fit columns
      worksheet.getColumn(1).width = 15;
      worksheet.getColumn(2).width = 18;
      worksheet.getColumn(3).width = 30;
      worksheet.getColumn(4).width = 15;
      worksheet.getColumn(5).width = 30;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

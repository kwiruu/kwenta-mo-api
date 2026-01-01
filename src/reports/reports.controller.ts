import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { ReportsService } from "./reports.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";

@ApiTags("reports")
@ApiBearerAuth()
@Controller("reports")
@UseGuards(SupabaseAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // COGS Report - Cost of Goods Sold
  @Get("cogs")
  async getCOGSReport(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.reportsService.getCOGSReport(req.user.id, startDate, endDate);
  }

  // Income Statement
  @Get("income-statement")
  async getIncomeStatement(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.reportsService.getIncomeStatement(
      req.user.id,
      startDate,
      endDate
    );
  }

  // Profit Summary by Recipe
  @Get("profit-summary")
  async getProfitSummary(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.reportsService.getProfitSummary(
      req.user.id,
      startDate,
      endDate
    );
  }

  // Expense Breakdown
  @Get("expense-breakdown")
  async getExpenseBreakdown(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.reportsService.getExpenseBreakdown(
      req.user.id,
      startDate,
      endDate
    );
  }

  // Dashboard Summary
  @Get("dashboard")
  async getDashboardSummary(@Request() req: any) {
    return this.reportsService.getDashboardSummary(req.user.id);
  }

  // Chart Data for Revenue & Expenses
  @Get("chart-data")
  async getChartData(
    @Request() req: any,
    @Query("period") period: "daily" | "weekly" | "monthly" = "daily"
  ) {
    return this.reportsService.getChartData(req.user.id, period);
  }

  // Export as CSV
  @Get("export/csv")
  async exportCSV(
    @Request() req: any,
    @Res() res: Response,
    @Query("type") type: "sales" | "expenses" | "ingredients",
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    const csv = await this.reportsService.exportCSV(
      req.user.id,
      type,
      startDate,
      endDate
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${type}-report.csv`
    );
    res.send(csv);
  }
}

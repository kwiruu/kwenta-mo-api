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
import { ExpensesService } from "./expenses.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

@ApiTags("expenses")
@ApiBearerAuth()
@Controller("expenses")
@UseGuards(SupabaseAuthGuard)
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query("category") category?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.expensesService.findAll(req.user.id, {
      category,
      startDate,
      endDate,
    });
  }

  @Get("stats")
  async getStats(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.expensesService.getStats(req.user.id, startDate, endDate);
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.expensesService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(req.user.id, dto);
  }

  @Post("bulk")
  async createBulk(@Request() req: any, @Body() dtos: CreateExpenseDto[]) {
    return this.expensesService.createBulk(req.user.id, dtos);
  }

  @Put(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateExpenseDto
  ) {
    return this.expensesService.update(req.user.id, id, dto);
  }

  @Delete(":id")
  async delete(@Request() req: any, @Param("id") id: string) {
    return this.expensesService.delete(req.user.id, id);
  }
}

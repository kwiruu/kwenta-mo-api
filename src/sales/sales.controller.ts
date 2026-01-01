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
import { SalesService } from "./sales.service";
import { SupabaseAuthGuard } from "../auth/supabase-auth.guard";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { UpdateSaleDto } from "./dto/update-sale.dto";

@ApiTags("sales")
@ApiBearerAuth()
@Controller("sales")
@UseGuards(SupabaseAuthGuard)
export class SalesController {
  constructor(private salesService: SalesService) {}

  @Get()
  async findAll(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("recipeId") recipeId?: string
  ) {
    return this.salesService.findAll(req.user.id, {
      startDate,
      endDate,
      recipeId,
    });
  }

  @Get("stats")
  async getStats(
    @Request() req: any,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.salesService.getStats(req.user.id, startDate, endDate);
  }

  @Get(":id")
  async findOne(@Request() req: any, @Param("id") id: string) {
    return this.salesService.findOne(req.user.id, id);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateSaleDto) {
    return this.salesService.create(req.user.id, dto);
  }

  @Put(":id")
  async update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateSaleDto
  ) {
    return this.salesService.update(req.user.id, id, dto);
  }

  @Delete(":id")
  async delete(@Request() req: any, @Param("id") id: string) {
    return this.salesService.delete(req.user.id, id);
  }
}

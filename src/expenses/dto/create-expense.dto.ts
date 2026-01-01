import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  IsEnum,
  Min,
} from "class-validator";

export enum ExpenseCategory {
  INGREDIENTS = "INGREDIENTS",
  LABOR = "LABOR",
  UTILITIES = "UTILITIES",
  RENT = "RENT",
  EQUIPMENT = "EQUIPMENT",
  MARKETING = "MARKETING",
  TRANSPORTATION = "TRANSPORTATION",
  PACKAGING = "PACKAGING",
  OTHER = "OTHER",
}

export class CreateExpenseDto {
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

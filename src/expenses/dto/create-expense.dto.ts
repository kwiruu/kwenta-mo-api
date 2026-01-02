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

export enum ExpenseFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  QUARTERLY = "QUARTERLY",
  YEARLY = "YEARLY",
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
  @IsEnum(ExpenseFrequency)
  frequency?: ExpenseFrequency;

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

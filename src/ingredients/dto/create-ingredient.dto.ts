import { IsString, IsNumber, IsOptional, Min } from "class-validator";

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  unit: string;

  @IsNumber()
  @Min(0)
  costPerUnit: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentStock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

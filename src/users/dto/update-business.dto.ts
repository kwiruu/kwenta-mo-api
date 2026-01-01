import { IsString, IsOptional, IsNumber } from "class-validator";

export class UpdateBusinessDto {
  @IsString()
  businessName: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  employeeCount?: number;

  @IsOptional()
  @IsNumber()
  avgMonthlySales?: number;

  @IsOptional()
  @IsString()
  rawMaterialSource?: string;
}

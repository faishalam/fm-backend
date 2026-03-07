import { IsNumber, IsOptional, Min } from 'class-validator';

export class FinancialProfileDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  salaryMonthly?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentSavings?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number;
}

// backward-compat aliases
export { FinancialProfileDto as CreateFinancialProfileDto };

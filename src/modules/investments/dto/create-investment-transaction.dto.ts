import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum InvestmentTransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export class CreateInvestmentTransactionDto {
  @IsEnum(InvestmentTransactionType)
  type: InvestmentTransactionType;

  @IsNumber()
  @Min(0.0001)
  unit: number;

  @IsNumber()
  @Min(1)
  pricePerUnit: number;

  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

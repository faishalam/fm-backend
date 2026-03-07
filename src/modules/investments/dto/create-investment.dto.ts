import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum InvestmentType {
  GOLD = 'GOLD',
  STOCK = 'STOCK',
  CRYPTO = 'CRYPTO',
  REKSADANA = 'REKSADANA',
  PROPERTY = 'PROPERTY',
}

export class CreateInvestmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(InvestmentType)
  type: InvestmentType;

  @IsOptional()
  @IsString()
  symbol?: string;
}

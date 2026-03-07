import { IsOptional, IsString } from 'class-validator';

export class UpdateInvestmentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  symbol?: string;
}

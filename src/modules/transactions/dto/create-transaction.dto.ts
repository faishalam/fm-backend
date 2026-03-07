import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { TransactionType } from '../../categories/dto/create-category.dto';

export class CreateTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  @Min(1)
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsDateString()
  @IsNotEmpty()
  transactionDate: string;
}

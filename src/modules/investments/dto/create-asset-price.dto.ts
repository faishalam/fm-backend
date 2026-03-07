import { IsNumber, Min } from 'class-validator';

export class CreateAssetPriceDto {
  @IsNumber()
  @Min(0)
  price: number;
}

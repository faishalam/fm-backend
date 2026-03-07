export class InvestmentTransactionEntity {
  id: string;
  investmentId: string;
  transactionId: string;
  type: string;
  unit: number;
  pricePerUnit: number;
  totalValue: number;
  transactionDate: Date | null;
  createdAt: Date;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
    this.unit = partial.unit != null ? Number(partial.unit) : 0;
    this.pricePerUnit =
      partial.pricePerUnit != null ? Number(partial.pricePerUnit) : 0;
    this.totalValue =
      partial.totalValue != null
        ? Number(partial.totalValue)
        : this.unit * this.pricePerUnit;
  }
}

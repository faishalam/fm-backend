export class InvestmentEntity {
  id: string;
  financialProfileId: string;
  name: string;
  type: string;
  symbol: string | null;
  createdAt: Date;
  totalUnits: number;
  currentValue: number;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);

    // Calculate total units from investment transactions
    if (Array.isArray(partial.investmentTransactions)) {
      const txs = partial.investmentTransactions as Record<string, unknown>[];
      this.totalUnits = txs.reduce((sum, t) => {
        const unit = Number(t.unit ?? 0);
        return t.type === 'BUY' ? sum + unit : sum - unit;
      }, 0);
    } else {
      this.totalUnits = 0;
    }

    // Calculate current value from latest asset price
    if (Array.isArray(partial.assetPrices) && (partial.assetPrices as unknown[]).length > 0) {
      const prices = partial.assetPrices as Record<string, unknown>[];
      const latestPrice = Number(prices[0].price ?? 0);
      this.currentValue = this.totalUnits * latestPrice;
    } else {
      this.currentValue = 0;
    }
  }
}

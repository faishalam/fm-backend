export class DebtEntity {
  id: string;
  financialProfileId: string;
  name: string;
  totalAmount: number;
  interestRate: number | null;
  startDate: Date | null;
  dueDate: Date | null;
  remainingAmount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
    this.totalAmount =
      partial.totalAmount != null ? Number(partial.totalAmount) : 0;
    this.interestRate =
      partial.interestRate != null ? Number(partial.interestRate) : null;

    // Calculate remaining from payments if available
    if (Array.isArray(partial.payments)) {
      const paid = (partial.payments as Record<string, unknown>[]).reduce(
        (sum, p) => sum + Number(p.amount ?? 0),
        0,
      );
      this.remainingAmount = this.totalAmount - paid;
    } else {
      this.remainingAmount = this.totalAmount;
    }
  }
}

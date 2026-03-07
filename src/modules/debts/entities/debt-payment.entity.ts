export class DebtPaymentEntity {
  id: string;
  debtId: string;
  transactionId: string;
  amount: number;
  paymentDate: Date | null;
  note: string | null;
  createdAt: Date;

  constructor(partial: Record<string, unknown>) {
    Object.assign(this, partial);
    this.amount = partial.amount != null ? Number(partial.amount) : 0;
  }
}

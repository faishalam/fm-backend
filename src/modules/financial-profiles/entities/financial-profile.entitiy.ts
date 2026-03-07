export class FinancialProfileEntity {
  id: string;
  userId: string;
  salaryMonthly: number | null;
  currentSavings: number;
  targetAmount: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Record<string, unknown>) {
    this.id = partial.id as string;
    this.userId = partial.userId as string;
    this.salaryMonthly =
      partial.salaryMonthly != null ? Number(partial.salaryMonthly) : null;
    this.currentSavings = Number(partial.currentSavings ?? 0);
    this.targetAmount = Number(partial.targetAmount ?? 1_000_000_000);
    this.createdAt = partial.createdAt as Date;
    this.updatedAt = partial.updatedAt as Date;
  }
}
